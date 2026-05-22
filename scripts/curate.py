"""
curate.py — Extract and preprocess target signs from ASL_Citizen.zip.

Outputs a dataset directory structure ready for training:
  data/frames/
    train/<GLOSS>/<clip_id>/frame_000.npy ... frame_NNN.npy
    val/<GLOSS>/<clip_id>/...
    test/<GLOSS>/<clip_id>/...

Each frame is a (64, 64, 3) uint8 numpy array (center-cropped, resized).
Also writes data/manifest.csv with columns: split, gloss, clip_id, n_frames.

Usage:
  python3 scripts/curate.py \
    --zip ~/ASL_Citizen.zip \
    --out ~/GauntletAI/partner-projects/stokoe/data \
    --fps 10
"""

import argparse
import csv
import io
import pathlib
import zipfile
from collections import defaultdict

import cv2
import numpy as np
from tqdm import tqdm

# ── Vocabulary map ─────────────────────────────────────────────────────────────
# Keys are the labels we use in the app (vocab.ts ids → display words).
# Values are the ASL Citizen gloss strings to match against.
# Where multiple variants exist we take the first match found.
VOCAB_MAP: dict[str, list[str]] = {
    "HELLO":         ["HELLO"],
    "GOODBYE":       ["BYE", "GOODBYE"],
    "PLEASE":        ["PLEASE"],
    "THANK YOU":     ["THANKYOU", "THANK YOU"],
    "SORRY":         ["SORRY"],
    "YES":           ["YES"],
    "NO":            ["NO"],
    "GOOD":          ["GOOD"],
    "BAD":           ["BAD"],
    "ONE":           ["ONE"],
    "TWO":           ["TWO"],
    "THREE":         ["THREE"],
    "FOUR":          ["FOUR"],
    "HAPPY":         ["HAPPY"],          # replaces FIVE (not in dataset)
    "SIX":           ["SIX"],
    "SEVEN":         ["SEVEN"],
    "EIGHT":         ["EIGHT"],
    "NINE":          ["NINE"],
    "RED":           ["RED"],
    "BLUE":          ["BLUE"],
    "GREEN":         ["GREEN"],
    "YELLOW":        ["YELLOW"],
    "ORANGE":        ["ORANGE"],
    "PURPLE":        ["PURPLE"],
    "BLACK":         ["BLACK"],
    "WHITE":         ["WHITE"],
    "MOTHER":        ["MOTHER"],
    "FATHER":        ["FATHER"],
    "SISTER":        ["SISTER"],
    "BROTHER":       ["BROTHER"],
    "BABY":          ["BABY1", "BABY"],
    "FAMILY":        ["FAMILY"],
    "EAT":           ["EAT1", "EAT"],
    "DRINK":         ["DRINK1", "DRINK"],
    "WANT":          ["WANT1", "WANT"],
    "LIKE":          ["LIKE"],
    "LOVE":          ["LOVE"],
    "HELP":          ["HELP"],
    "KNOW":          ["KNOW"],
    "UNDERSTAND":    ["UNDERSTAND"],
    "GO":            ["GO"],
    "COME":          ["COME"],
    "SEE":           ["SEE"],
    "LEARN":         ["LEARN"],
    "SLEEP":         ["SLEEP"],
    "TIRED":         ["TIRED"],          # replaces YOU'RE WELCOME (not in dataset)
    "ME":            ["ME"],
    "YOU":           ["YOU"],
    "WATER":         ["WATER"],
    "HOME":          ["HOME"],
    "SCHOOL":        ["SCHOOL"],
    "BOOK":          ["BOOK"],
    "NAME":          ["NAME"],
    "WHAT":          ["WHAT1", "WHAT"],
    "WHERE":         ["WHERE"],
    "WHO":           ["WHO"],
    "HOW":           ["HOW1", "HOW"],
    "WHY":           ["WHY"],
    "BIG":           ["BIG"],
    "SMALL":         ["SMALL"],
    "HOT":           ["HOT"],
    "COLD":          ["COLD"],
    "STOP":          ["STOP"],           # replaces TEN (not in dataset)
}

# Reverse map: gloss → canonical label
GLOSS_TO_LABEL: dict[str, str] = {}
for label, glosses in VOCAB_MAP.items():
    for g in glosses:
        if g not in GLOSS_TO_LABEL:
            GLOSS_TO_LABEL[g] = label


def center_crop_resize(frame: np.ndarray, size: int = 64) -> np.ndarray:
    h, w = frame.shape[:2]
    side = min(h, w)
    top = (h - side) // 2
    left = (w - side) // 2
    cropped = frame[top:top+side, left:left+side]
    return cv2.resize(cropped, (size, size), interpolation=cv2.INTER_AREA)


def extract_frames(video_bytes: bytes, target_fps: int = 10) -> list[np.ndarray]:
    arr = np.frombuffer(video_bytes, dtype=np.uint8)
    cap = cv2.VideoCapture()
    # Write to temp buffer via imencode trick — use imdecode on video bytes
    # OpenCV doesn't support in-memory video directly; write to /tmp
    tmp = pathlib.Path("/tmp/_stokoe_tmp.mp4")
    tmp.write_bytes(video_bytes)
    cap = cv2.VideoCapture(str(tmp))

    src_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    step = max(1, round(src_fps / target_fps))
    frames = []
    idx = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        if idx % step == 0:
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frames.append(center_crop_resize(rgb))
        idx += 1
    cap.release()
    tmp.unlink(missing_ok=True)
    return frames


def load_splits(data_dir: pathlib.Path) -> dict[str, list[tuple[str, str]]]:
    """Returns {split: [(video_filename, gloss), ...]} filtered to our vocab."""
    result: dict[str, list[tuple[str, str]]] = {"train": [], "val": [], "test": []}
    for split in result:
        with open(data_dir / f"{split}.csv") as f:
            for row in csv.DictReader(f):
                gloss = row["Gloss"].strip().upper()
                if gloss in GLOSS_TO_LABEL:
                    result[split].append((row["Video file"].strip(), gloss))
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--zip", required=True, help="Path to ASL_Citizen.zip")
    parser.add_argument("--out", required=True, help="Output data directory")
    parser.add_argument("--fps", type=int, default=10, help="Target frames per second")
    parser.add_argument("--size", type=int, default=64, help="Frame size (square)")
    args = parser.parse_args()

    zip_path = pathlib.Path(args.zip).expanduser()
    out_dir = pathlib.Path(args.out).expanduser()
    data_dir = out_dir  # CSVs already here

    splits = load_splits(data_dir)
    total = sum(len(v) for v in splits.values())
    print(f"Target clips: {total} across {len(VOCAB_MAP)} labels")
    for split, items in splits.items():
        label_counts = defaultdict(int)
        for _, g in items:
            label_counts[GLOSS_TO_LABEL[g]] += 1
        print(f"  {split}: {len(items)} clips, {len(label_counts)} labels")

    # Build set of filenames we need
    needed: dict[str, tuple[str, str]] = {}  # filename → (split, gloss)
    for split, items in splits.items():
        for fname, gloss in items:
            needed[fname] = (split, gloss)

    manifest_rows = []
    frames_dir = out_dir / "frames"

    print(f"\nExtracting from {zip_path} ...")
    with zipfile.ZipFile(zip_path) as zf:
        members = [m for m in zf.namelist() if m.endswith(".mp4")]
        for member in tqdm(members, desc="Videos", unit="clip"):
            filename = pathlib.Path(member).name
            if filename not in needed:
                continue

            split, gloss = needed[filename]
            label = GLOSS_TO_LABEL[gloss]
            clip_id = pathlib.Path(filename).stem

            clip_dir = frames_dir / split / label / clip_id
            clip_dir.mkdir(parents=True, exist_ok=True)

            # Skip if already extracted
            existing = list(clip_dir.glob("frame_*.npy"))
            if existing:
                manifest_rows.append({
                    "split": split, "gloss": label,
                    "clip_id": clip_id, "n_frames": len(existing)
                })
                continue

            video_bytes = zf.read(member)
            frames = extract_frames(video_bytes, target_fps=args.fps)

            if len(frames) < 4:
                print(f"  SKIP {filename}: only {len(frames)} frames")
                continue

            for i, frame in enumerate(frames):
                np.save(clip_dir / f"frame_{i:03d}.npy", frame)

            manifest_rows.append({
                "split": split, "gloss": label,
                "clip_id": clip_id, "n_frames": len(frames)
            })

    # Write manifest
    manifest_path = out_dir / "manifest.csv"
    with open(manifest_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["split", "gloss", "clip_id", "n_frames"])
        writer.writeheader()
        writer.writerows(manifest_rows)

    print(f"\nDone. {len(manifest_rows)} clips extracted.")
    print(f"Manifest: {manifest_path}")

    # Summary
    by_label = defaultdict(lambda: defaultdict(int))
    for row in manifest_rows:
        by_label[row["gloss"]][row["split"]] += 1
    print("\nPer-label clip counts (train / val / test):")
    for label in sorted(by_label):
        c = by_label[label]
        print(f"  {label:20s}  train={c.get('train',0)}  val={c.get('val',0)}  test={c.get('test',0)}")


if __name__ == "__main__":
    main()
