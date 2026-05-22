"""
train_dez.py — Train handshape (dez) classifier on MediaPipe keypoints.

Maps 21 normalized hand landmarks (63 floats) → one of 15 dez categories.
Uses PyTorch. Exports to ONNX for browser inference via onnxruntime-web.

The dez categories correspond to Stokoe dez symbols and are derived from
the gloss labels in the dataset — each sign's known dez symbol (from
notation.ts) is used as the training label for frames from that sign.

Architecture: 3-layer MLP. Single-frame, no temporal model needed —
handshape is static per frame by definition.

Usage:
  pip3 install torch onnx --break-system-packages
  python3 scripts/train_dez.py \
    --data ~/GauntletAI/partner-projects/stokoe/data \
    --out  ~/GauntletAI/partner-projects/stokoe/model/dez
"""

import argparse
import csv
import json
import pathlib
import time

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset

# DEZ label for each sign — derived from notation.ts
# Each sign contributes its per-frame landmarks as examples of its dez symbol
SIGN_TO_DEZ = {
    "HELLO": "5", "GOODBYE": "5", "PLEASE": "B", "THANK YOU": "B",
    "SORRY": "A", "YES": "A", "NO": "H", "GOOD": "B", "BAD": "B",
    "TIRED": "5", "ONE": "G", "TWO": "V", "THREE": "3", "FOUR": "W",
    "HAPPY": "B", "SIX": "Y", "SEVEN": "8", "EIGHT": "F", "NINE": "F",
    "RED": "G", "BLUE": "B", "GREEN": "G", "YELLOW": "Y", "ORANGE": "C",
    "PURPLE": "K", "BLACK": "G", "WHITE": "5", "MOTHER": "5", "FATHER": "5",
    "SISTER": "L", "BROTHER": "L", "BABY": "B", "FAMILY": "F",
    "EAT": "O", "DRINK": "C", "WANT": "5", "LIKE": "8", "LOVE": "A",
    "HELP": "B", "KNOW": "B", "UNDERSTAND": "A", "GO": "G", "COME": "G",
    "SEE": "V", "LEARN": "O", "SLEEP": "5", "ME": "G", "YOU": "G",
    "WATER": "W", "HOME": "O", "SCHOOL": "B", "BOOK": "B", "NAME": "H",
    "WHAT": "5", "WHERE": "G", "WHO": "L", "HOW": "B", "WHY": "B",
    "BIG": "L", "SMALL": "B", "HOT": "C", "COLD": "A", "STOP": "B",
}

DEZ_LABELS = sorted(set(SIGN_TO_DEZ.values()))
DEZ_INDEX = {d: i for i, d in enumerate(DEZ_LABELS)}


class DezMLP(nn.Module):
    def __init__(self, n_classes: int):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(63, 128), nn.ReLU(), nn.Dropout(0.3),
            nn.Linear(128, 64), nn.ReLU(), nn.Dropout(0.2),
            nn.Linear(64, n_classes),
        )

    def forward(self, x):
        return self.net(x)


def load_data(data_dir: pathlib.Path):
    kp_dir = data_dir / "keypoints"
    X = {"train": [], "val": [], "test": []}
    y = {"train": [], "val": [], "test": []}

    for split in ["train", "val", "test"]:
        for sign, dez in SIGN_TO_DEZ.items():
            sign_dir = kp_dir / split / sign
            if not sign_dir.exists():
                continue
            for npy in sign_dir.glob("*.npy"):
                seq = np.load(npy)  # (n_frames, 63)
                # Use all frames as individual examples
                for frame in seq:
                    if np.any(frame != 0):  # skip zero frames (no hand detected)
                        X[split].append(frame)
                        y[split].append(DEZ_INDEX[dez])

    return X, y


def make_tensors(X, y):
    Xt = torch.tensor(np.array(X), dtype=torch.float32)
    yt = torch.tensor(y, dtype=torch.long)
    return TensorDataset(Xt, yt)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--epochs", type=int, default=30)
    parser.add_argument("--batch", type=int, default=64)
    parser.add_argument("--lr", type=float, default=1e-3)
    args = parser.parse_args()

    data_dir = pathlib.Path(args.data).expanduser()
    out_dir = pathlib.Path(args.out).expanduser()
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"DEZ classes ({len(DEZ_LABELS)}): {DEZ_LABELS}")

    print("Loading keypoints...")
    X, y = load_data(data_dir)
    for split in ["train", "val", "test"]:
        print(f"  {split}: {len(X[split])} frames")

    train_ds = make_tensors(X["train"], y["train"])
    val_ds = make_tensors(X["val"], y["val"])
    test_ds = make_tensors(X["test"], y["test"])

    train_loader = DataLoader(train_ds, batch_size=args.batch, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=256)
    test_loader = DataLoader(test_ds, batch_size=256)

    model = DezMLP(n_classes=len(DEZ_LABELS))
    optimizer = torch.optim.Adam(model.parameters(), lr=args.lr)
    criterion = nn.CrossEntropyLoss()
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, patience=3, factor=0.5, min_lr=1e-5
    )

    best_val_acc = 0.0
    best_path = out_dir / "dez_best.pt"

    for epoch in range(args.epochs):
        model.train()
        train_loss = 0.0
        for Xb, yb in train_loader:
            optimizer.zero_grad()
            loss = criterion(model(Xb), yb)
            loss.backward()
            optimizer.step()
            train_loss += loss.item()

        model.eval()
        correct = total = 0
        with torch.no_grad():
            for Xb, yb in val_loader:
                preds = model(Xb).argmax(dim=1)
                correct += (preds == yb).sum().item()
                total += len(yb)
        val_acc = correct / total
        scheduler.step(train_loss)

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), best_path)

        if (epoch + 1) % 5 == 0:
            print(f"Epoch {epoch+1:3d}  loss={train_loss/len(train_loader):.4f}  val_acc={val_acc:.4f}")

    # Load best, evaluate on test
    model.load_state_dict(torch.load(best_path))
    model.eval()
    correct = total = 0
    with torch.no_grad():
        for Xb, yb in test_loader:
            correct += (model(Xb).argmax(dim=1) == yb).sum().item()
            total += len(yb)
    print(f"\nTest accuracy: {correct/total:.4f}")

    # Export to ONNX
    onnx_path = out_dir / "dez_classifier.onnx"
    dummy = torch.randn(1, 63)
    torch.onnx.export(
        model, dummy, str(onnx_path),
        input_names=["landmarks"],
        output_names=["logits"],
        dynamic_axes={"landmarks": {0: "batch"}, "logits": {0: "batch"}},
        opset_version=17,
    )
    print(f"ONNX saved: {onnx_path}")

    # Save metadata
    meta = {
        "dez_labels": DEZ_LABELS,
        "dez_index": DEZ_INDEX,
        "n_landmarks": 63,
        "test_accuracy": round(correct / total, 4),
        "run_id": time.strftime("%Y%m%d_%H%M%S"),
    }
    (out_dir / "dez_meta.json").write_text(json.dumps(meta, indent=2))
    print(f"Metadata: {out_dir / 'dez_meta.json'}")


if __name__ == "__main__":
    main()
