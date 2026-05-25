"""
Train the Stokoe Dez MLP from JSONL keypoints and export an ONNX model.

Input rows should come from scripts/download_asl_citizen_keypoints.py:
  {"sign_id": "hello", "split": "train", "keypoints": [[63 floats], ...]}

Example:
  python3 scripts/train_dez_from_keypoints.py \
    --keypoints data/keypoints.jsonl \
    --sign-ids hello please thank-you sorry yes no one two three four \
    --out public/model/dez/model.onnx
"""

from __future__ import annotations

import argparse
import json
import pathlib
import random
import re
import time
from collections import Counter

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset


def repo_root() -> pathlib.Path:
    return pathlib.Path(__file__).resolve().parents[1]


def parse_vocab_ids(vocab_path: pathlib.Path) -> list[str]:
    text = vocab_path.read_text()
    return re.findall(r'id:\s*"([^"]+)"', text)


def parse_notation_dez(notation_path: pathlib.Path) -> dict[str, str]:
    text = notation_path.read_text()
    pattern = re.compile(r'"([^"]+)":\s*\{.*?dez:\s*"([^"]+)"', re.S)
    return {sign_id: dez for sign_id, dez in pattern.findall(text)}


def read_sign_ids(args: argparse.Namespace, vocab_ids: list[str]) -> list[str]:
    if args.sign_ids:
        return args.sign_ids
    if args.sign_ids_file:
        return [
            line.strip()
            for line in pathlib.Path(args.sign_ids_file).expanduser().read_text().splitlines()
            if line.strip() and not line.strip().startswith("#")
        ]
    return vocab_ids[:10]


class DezMLP(nn.Module):
    def __init__(self, n_classes: int):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(63, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, n_classes),
        )

    def forward(self, x):
        return self.net(x)


def split_name(raw: str | None) -> str:
    if raw in {"train", "val", "test"}:
        return raw
    return "train"


def load_jsonl(
    keypoints_path: pathlib.Path,
    sign_ids: set[str],
    sign_to_dez: dict[str, str],
) -> tuple[dict[str, list[np.ndarray]], dict[str, list[int]], list[str]]:
    labels = sorted({sign_to_dez[sign_id] for sign_id in sign_ids})
    label_index = {label: i for i, label in enumerate(labels)}

    X: dict[str, list[np.ndarray]] = {"train": [], "val": [], "test": []}
    y: dict[str, list[int]] = {"train": [], "val": [], "test": []}

    with keypoints_path.open() as f:
        for line_no, line in enumerate(f, start=1):
            if not line.strip():
                continue
            row = json.loads(line)
            sign_id = row.get("sign_id")
            if sign_id not in sign_ids:
                continue

            dez = sign_to_dez.get(sign_id)
            if dez is None:
                raise ValueError(f"No notation dez mapping for {sign_id} on line {line_no}")

            split = split_name(row.get("split"))
            target = label_index[dez]
            for vector in row.get("keypoints", []):
                arr = np.asarray(vector, dtype=np.float32)
                if arr.shape != (63,):
                    raise ValueError(f"Expected 63 floats on line {line_no}, got shape {arr.shape}")
                if np.any(arr):
                    X[split].append(arr)
                    y[split].append(target)

    return X, y, labels


def backfill_splits(X: dict[str, list[np.ndarray]], y: dict[str, list[int]], seed: int) -> None:
    if X["val"] and X["test"]:
        return

    rng = random.Random(seed)
    paired = list(zip(X["train"], y["train"], strict=True))
    rng.shuffle(paired)
    n = len(paired)
    n_val = max(1, int(n * 0.15))
    n_test = max(1, int(n * 0.15))

    test = paired[:n_test]
    val = paired[n_test:n_test + n_val]
    train = paired[n_test + n_val:]

    X["train"], y["train"] = [p[0] for p in train], [p[1] for p in train]
    X["val"], y["val"] = [p[0] for p in val], [p[1] for p in val]
    X["test"], y["test"] = [p[0] for p in test], [p[1] for p in test]


def tensor_dataset(X: list[np.ndarray], y: list[int]) -> TensorDataset:
    return TensorDataset(
        torch.tensor(np.asarray(X), dtype=torch.float32),
        torch.tensor(y, dtype=torch.long),
    )


def accuracy(model: nn.Module, loader: DataLoader) -> float:
    model.eval()
    correct = total = 0
    with torch.no_grad():
        for xb, yb in loader:
            pred = model(xb).argmax(dim=1)
            correct += (pred == yb).sum().item()
            total += len(yb)
    return correct / total if total else 0.0


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--keypoints", default="data/keypoints.jsonl")
    parser.add_argument("--sign-ids", nargs="+", default=None)
    parser.add_argument("--sign-ids-file", default=None)
    parser.add_argument("--out", default="public/model/dez/model.onnx")
    parser.add_argument("--meta-out", default=None)
    parser.add_argument("--epochs", type=int, default=40)
    parser.add_argument("--batch", type=int, default=64)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    torch.manual_seed(args.seed)
    np.random.seed(args.seed)
    random.seed(args.seed)

    root = repo_root()
    vocab_ids = parse_vocab_ids(root / "src/data/vocab.ts")
    sign_ids = read_sign_ids(args, vocab_ids)
    unknown = sorted(set(sign_ids) - set(vocab_ids))
    if unknown:
        raise ValueError(f"Sign IDs are not in vocab.ts: {', '.join(unknown)}")

    sign_to_dez = parse_notation_dez(root / "src/data/notation.ts")
    missing_dez = sorted(set(sign_ids) - set(sign_to_dez))
    if missing_dez:
        raise ValueError(f"Sign IDs have no notation dez mapping: {', '.join(missing_dez)}")

    keypoints_path = (root / args.keypoints).resolve()
    X, y, labels = load_jsonl(keypoints_path, set(sign_ids), sign_to_dez)
    backfill_splits(X, y, args.seed)

    for split in ("train", "val", "test"):
        print(f"{split}: {len(X[split])} frames")
    print(f"Dez labels ({len(labels)}): {labels}")
    print(f"Class counts: {dict(Counter(y['train']))}")

    if not X["train"]:
        raise ValueError("No training frames found for selected sign IDs")

    train_loader = DataLoader(tensor_dataset(X["train"], y["train"]), batch_size=args.batch, shuffle=True)
    val_loader = DataLoader(tensor_dataset(X["val"], y["val"]), batch_size=256)
    test_loader = DataLoader(tensor_dataset(X["test"], y["test"]), batch_size=256)

    model = DezMLP(len(labels))
    optimizer = torch.optim.Adam(model.parameters(), lr=args.lr)
    criterion = nn.CrossEntropyLoss()

    best_state = None
    best_val_acc = -1.0
    for epoch in range(args.epochs):
        model.train()
        total_loss = 0.0
        for xb, yb in train_loader:
            optimizer.zero_grad()
            loss = criterion(model(xb), yb)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        val_acc = accuracy(model, val_loader)
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_state = {k: v.detach().clone() for k, v in model.state_dict().items()}

        if (epoch + 1) % 5 == 0 or epoch == 0:
            avg_loss = total_loss / max(1, len(train_loader))
            print(f"epoch={epoch + 1:03d} loss={avg_loss:.4f} val_acc={val_acc:.4f}")

    if best_state is not None:
        model.load_state_dict(best_state)

    test_acc = accuracy(model, test_loader)
    print(f"test_acc={test_acc:.4f}")

    out_path = (root / args.out).resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    dummy = torch.randn(1, 63)
    torch.onnx.export(
        model,
        dummy,
        str(out_path),
        input_names=["landmarks"],
        output_names=["logits"],
        dynamic_axes={"landmarks": {0: "batch"}, "logits": {0: "batch"}},
        opset_version=17,
        dynamo=False,
    )

    meta_path = (root / args.meta_out).resolve() if args.meta_out else out_path.with_suffix(".meta.json")
    meta = {
        "dez_labels": labels,
        "dez_index": {label: i for i, label in enumerate(labels)},
        "sign_ids": sign_ids,
        "n_landmarks": 63,
        "test_accuracy": round(test_acc, 4),
        "best_val_accuracy": round(best_val_acc, 4),
        "run_id": time.strftime("%Y%m%d_%H%M%S"),
    }
    meta_path.write_text(json.dumps(meta, indent=2) + "\n")

    print(f"ONNX saved: {out_path}")
    print(f"Metadata saved: {meta_path}")


if __name__ == "__main__":
    main()
