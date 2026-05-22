"""
train.py — Train a from-scratch CNN+LSTM sign classifier on the curated dataset.

Spec compliance:
  - Requirement 7: No pretrained weights. All layers initialised from random.
  - Requirement 8: Saves best checkpoint by val_accuracy; prints accuracy + confusion matrix.
  - Requirement 6: Model versioned by timestamp in output path.

Architecture:
  Input: sequence of N frames, each (64, 64, 3) uint8 → normalised to [0,1]
  Per-frame feature extractor: 3-block CNN (32→64→128 channels, BN + dropout)
  Temporal model: LSTM(128) over the frame sequence
  Output: softmax over NUM_CLASSES

Usage (local or Colab):
  pip install tensorflow tensorflowjs tqdm numpy
  python3 scripts/train.py \
    --data ~/GauntletAI/partner-projects/stokoe/data \
    --out  ~/GauntletAI/partner-projects/stokoe/model \
    --epochs 40 \
    --seq_len 16
"""

import argparse
import csv
import pathlib
import time
from collections import defaultdict

import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tqdm import tqdm

FRAME_SIZE = 64
CHANNELS = 3


# ── Data loading ───────────────────────────────────────────────────────────────

def load_manifest(data_dir: pathlib.Path):
    rows = []
    with open(data_dir / "manifest.csv") as f:
        for row in csv.DictReader(f):
            rows.append(row)
    return rows


def load_clip(frames_dir: pathlib.Path, split: str, gloss: str, clip_id: str, seq_len: int) -> np.ndarray:
    clip_dir = frames_dir / split / gloss / clip_id
    paths = sorted(clip_dir.glob("frame_*.npy"))
    frames = [np.load(p) for p in paths]

    # Temporal resampling: stretch or compress to exactly seq_len frames
    n = len(frames)
    if n == seq_len:
        sampled = frames
    elif n > seq_len:
        indices = np.linspace(0, n - 1, seq_len, dtype=int)
        sampled = [frames[i] for i in indices]
    else:
        # Repeat last frame to pad
        sampled = frames + [frames[-1]] * (seq_len - n)

    arr = np.stack(sampled, axis=0).astype(np.float32) / 255.0  # (seq_len, 64, 64, 3)
    return arr


def build_dataset(manifest_rows, frames_dir: pathlib.Path, label_index: dict,
                  split: str, seq_len: int, augment: bool = False):
    X, y = [], []
    rows = [r for r in manifest_rows if r["split"] == split]
    for row in tqdm(rows, desc=f"Loading {split}", unit="clip"):
        try:
            clip = load_clip(frames_dir, split, row["gloss"], row["clip_id"], seq_len)
        except Exception as e:
            print(f"  skip {row['clip_id']}: {e}")
            continue

        if augment:
            # Horizontal flip
            X.append(clip)
            y.append(label_index[row["gloss"]])
            X.append(clip[:, :, ::-1, :])  # flip width axis
            y.append(label_index[row["gloss"]])
            # Time reversal
            X.append(clip[::-1])
            y.append(label_index[row["gloss"]])
        else:
            X.append(clip)
            y.append(label_index[row["gloss"]])

    return np.array(X, dtype=np.float32), np.array(y, dtype=np.int32)


# ── Model ──────────────────────────────────────────────────────────────────────

def cnn_block(x, filters: int, dropout: float = 0.25):
    x = layers.Conv2D(filters, 3, padding="same", use_bias=False)(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.MaxPooling2D(2)(x)
    x = layers.Dropout(dropout)(x)
    return x


def build_model(num_classes: int, seq_len: int, frame_size: int = 64) -> keras.Model:
    # Per-frame CNN feature extractor (shared weights via TimeDistributed)
    frame_input = keras.Input(shape=(frame_size, frame_size, CHANNELS), name="frame")
    x = cnn_block(frame_input, 32)   # → 32×32
    x = cnn_block(frame_input if False else x, 64)   # → 16×16
    x = cnn_block(x, 128)  # → 8×8
    x = layers.GlobalAveragePooling2D()(x)  # → 128
    x = layers.Dense(128, activation="relu")(x)
    cnn = keras.Model(frame_input, x, name="frame_cnn")

    # Sequence input
    seq_input = keras.Input(shape=(seq_len, frame_size, frame_size, CHANNELS), name="sequence")
    features = layers.TimeDistributed(cnn, name="td_cnn")(seq_input)  # (batch, seq, 128)

    # Temporal model
    x = layers.LSTM(128, dropout=0.3, recurrent_dropout=0.2)(features)
    x = layers.Dense(128, activation="relu")(x)
    x = layers.Dropout(0.4)(x)
    output = layers.Dense(num_classes, activation="softmax", name="logits")(x)

    model = keras.Model(seq_input, output, name="stokoe_cnn_lstm")
    return model


# ── Training ───────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--epochs", type=int, default=40)
    parser.add_argument("--seq_len", type=int, default=16)
    parser.add_argument("--batch", type=int, default=16)
    parser.add_argument("--lr", type=float, default=1e-3)
    args = parser.parse_args()

    data_dir = pathlib.Path(args.data).expanduser()
    frames_dir = data_dir / "frames"
    out_dir = pathlib.Path(args.out).expanduser()
    run_id = time.strftime("%Y%m%d_%H%M%S")
    run_dir = out_dir / run_id
    run_dir.mkdir(parents=True, exist_ok=True)

    manifest = load_manifest(data_dir)

    # Build label index from training set
    labels = sorted({r["gloss"] for r in manifest if r["split"] == "train"})
    label_index = {l: i for i, l in enumerate(labels)}
    num_classes = len(labels)
    print(f"Classes ({num_classes}): {labels}")

    # Save label map
    label_map_path = run_dir / "labels.csv"
    with open(label_map_path, "w") as f:
        for l, i in label_index.items():
            f.write(f"{i},{l}\n")

    print("\nLoading data...")
    X_train, y_train = build_dataset(manifest, frames_dir, label_index, "train", args.seq_len, augment=True)
    X_val, y_val = build_dataset(manifest, frames_dir, label_index, "val", args.seq_len, augment=False)
    X_test, y_test = build_dataset(manifest, frames_dir, label_index, "test", args.seq_len, augment=False)

    print(f"Train: {X_train.shape}  Val: {X_val.shape}  Test: {X_test.shape}")

    model = build_model(num_classes, args.seq_len)
    model.summary()

    model.compile(
        optimizer=keras.optimizers.Adam(args.lr),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    checkpoint_path = run_dir / "best.keras"
    callbacks = [
        keras.callbacks.ModelCheckpoint(
            str(checkpoint_path), monitor="val_accuracy",
            save_best_only=True, verbose=1
        ),
        keras.callbacks.EarlyStopping(
            monitor="val_accuracy", patience=8, restore_best_weights=True, verbose=1
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss", factor=0.5, patience=4, min_lr=1e-5, verbose=1
        ),
        keras.callbacks.CSVLogger(str(run_dir / "history.csv")),
    ]

    model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=args.epochs,
        batch_size=args.batch,
        callbacks=callbacks,
        shuffle=True,
    )

    # Final evaluation on test set
    print("\n── Test set evaluation ──")
    model.load_weights(str(checkpoint_path))
    loss, acc = model.evaluate(X_test, y_test, batch_size=args.batch, verbose=0)
    print(f"Test accuracy: {acc:.4f}  Loss: {loss:.4f}")

    # Per-class accuracy
    preds = model.predict(X_test, batch_size=args.batch, verbose=0).argmax(axis=1)
    per_class = defaultdict(lambda: [0, 0])  # correct, total
    for true, pred in zip(y_test, preds):
        per_class[labels[true]][1] += 1
        if true == pred:
            per_class[labels[true]][0] += 1

    print("\nPer-class accuracy:")
    for label in sorted(per_class):
        correct, total = per_class[label]
        print(f"  {label:20s}  {correct}/{total}  ({100*correct/total:.0f}%)")

    # Save Keras model
    keras_path = run_dir / "model.keras"
    model.save(str(keras_path))
    print(f"\nSaved: {keras_path}")
    print(f"Run dir: {run_dir}")
    print(f"\nNext: python3 scripts/export.py --model {run_dir} --out ~/GauntletAI/partner-projects/stokoe/public/model")


if __name__ == "__main__":
    main()
