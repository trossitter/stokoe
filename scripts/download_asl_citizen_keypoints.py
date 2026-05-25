"""
Download ASL Citizen files from a Hugging Face dataset repo, filter to Stokoe
vocab sign IDs, extract MediaPipe hand landmarks, and write JSONL keypoints.

The script expects an ASL Citizen mirror on Hugging Face that contains:
  - train.csv, val.csv, test.csv with columns "Gloss" and "Video file"
  - either loose .mp4 files or an ASL_Citizen.zip containing those videos

Example:
  python3 scripts/download_asl_citizen_keypoints.py \
    --repo-id <hf-user-or-org>/<asl-citizen-mirror> \
    --sign-ids hello please thank-you sorry yes no one two three four \
    --out data/keypoints.jsonl
"""

from __future__ import annotations

import argparse
import csv
import json
import pathlib
import re
import tempfile
import zipfile
from dataclasses import dataclass
from typing import Iterable

cv2 = None
mp = None
np = None
snapshot_download = None
BaseOptions = None
HandLandmarker = None
HandLandmarkerOptions = None
RunningMode = None
tqdm = None

WRIST = 0
MIDDLE_MCP = 9
UPSCALE = 256

GLOSS_ALIASES: dict[str, list[str]] = {
    "goodbye": ["BYE", "GOODBYE"],
    "thank-you": ["THANKYOU", "THANK YOU"],
    "baby": ["BABY1", "BABY"],
    "eat": ["EAT1", "EAT"],
    "drink": ["DRINK1", "DRINK"],
    "want": ["WANT1", "WANT"],
    "what": ["WHAT1", "WHAT"],
    "how": ["HOW1", "HOW"],
    "i-me": ["ME", "I", "I ME"],
}


@dataclass(frozen=True)
class VocabItem:
    sign_id: str
    word: str


@dataclass(frozen=True)
class ClipRow:
    split: str
    sign_id: str
    gloss: str
    video_file: str


def repo_root() -> pathlib.Path:
    return pathlib.Path(__file__).resolve().parents[1]


def load_runtime_dependencies() -> None:
    global cv2, mp, np, snapshot_download
    global BaseOptions, HandLandmarker, HandLandmarkerOptions, RunningMode, tqdm

    try:
        import cv2 as cv2_module
        import mediapipe as mp_module
        import numpy as np_module
        from huggingface_hub import snapshot_download as snapshot_download_fn
        from tqdm import tqdm as tqdm_fn
        from mediapipe.tasks.python import BaseOptions as BaseOptionsClass
        from mediapipe.tasks.python.vision import (
            HandLandmarker as HandLandmarkerClass,
            HandLandmarkerOptions as HandLandmarkerOptionsClass,
            RunningMode as RunningModeClass,
        )
    except ModuleNotFoundError as exc:
        raise SystemExit(
            "Missing Python dependency. Install with:\n"
            "  python3 -m pip install huggingface_hub mediapipe opencv-python numpy tqdm torch onnx"
        ) from exc

    cv2 = cv2_module
    mp = mp_module
    np = np_module
    snapshot_download = snapshot_download_fn
    BaseOptions = BaseOptionsClass
    HandLandmarker = HandLandmarkerClass
    HandLandmarkerOptions = HandLandmarkerOptionsClass
    RunningMode = RunningModeClass
    tqdm = tqdm_fn


def parse_vocab(vocab_path: pathlib.Path) -> list[VocabItem]:
    text = vocab_path.read_text()
    pattern = re.compile(r'id:\s*"([^"]+)".*?word:\s*"([^"]+)"', re.S)
    return [VocabItem(sign_id, word) for sign_id, word in pattern.findall(text)]


def gloss_candidates(item: VocabItem) -> list[str]:
    if item.sign_id in GLOSS_ALIASES:
        return GLOSS_ALIASES[item.sign_id]

    raw = item.word.upper()
    variants = {
        raw,
        re.sub(r"[^A-Z0-9]", "", raw),
        item.sign_id.upper().replace("-", ""),
        item.sign_id.upper().replace("-", " "),
    }
    return [v for v in variants if v]


def build_gloss_map(vocab: list[VocabItem], sign_ids: set[str]) -> dict[str, str]:
    by_id = {item.sign_id: item for item in vocab}
    missing = sorted(sign_ids - set(by_id))
    if missing:
        raise ValueError(f"Sign IDs are not in vocab.ts: {', '.join(missing)}")

    result: dict[str, str] = {}
    for sign_id in sign_ids:
        for gloss in gloss_candidates(by_id[sign_id]):
            result.setdefault(gloss, sign_id)
    return result


def read_sign_ids(args: argparse.Namespace, vocab: list[VocabItem]) -> list[str]:
    if args.sign_ids:
        return args.sign_ids
    if args.sign_ids_file:
        return [
            line.strip()
            for line in pathlib.Path(args.sign_ids_file).expanduser().read_text().splitlines()
            if line.strip() and not line.strip().startswith("#")
        ]
    return [item.sign_id for item in vocab[:10]]


def load_split_rows(snapshot_dir: pathlib.Path, gloss_map: dict[str, str]) -> list[ClipRow]:
    rows: list[ClipRow] = []
    for split in ("train", "val", "test"):
        csv_path = next(snapshot_dir.rglob(f"{split}.csv"), None)
        if csv_path is None:
            raise FileNotFoundError(f"Could not find {split}.csv in {snapshot_dir}")

        with csv_path.open(newline="") as f:
            for row in csv.DictReader(f):
                gloss = row["Gloss"].strip().upper()
                if gloss not in gloss_map:
                    continue
                rows.append(
                    ClipRow(
                        split=split,
                        sign_id=gloss_map[gloss],
                        gloss=gloss,
                        video_file=row["Video file"].strip(),
                    )
                )
    return rows


def normalize_landmarks(landmarks) -> np.ndarray:
    pts = np.array([[lm.x, lm.y, lm.z] for lm in landmarks], dtype=np.float32)
    pts -= pts[WRIST].copy()
    scale = np.linalg.norm(pts[MIDDLE_MCP]) + 1e-6
    pts /= scale
    return pts.flatten()


def extract_keypoints(video_path: pathlib.Path, detector, target_fps: int) -> tuple[list[list[float]], int]:
    cap = cv2.VideoCapture(str(video_path))
    src_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    step = max(1, round(src_fps / target_fps))

    vectors: list[list[float]] = []
    frame_count = 0
    idx = 0
    while True:
        ok, frame_bgr = cap.read()
        if not ok:
            break

        if idx % step == 0:
            frame_count += 1
            rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
            big = cv2.resize(rgb, (UPSCALE, UPSCALE), interpolation=cv2.INTER_LINEAR)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=big)
            result = detector.detect(mp_image)
            if result.hand_landmarks:
                vectors.append(normalize_landmarks(result.hand_landmarks[0]).tolist())
        idx += 1

    cap.release()
    return vectors, frame_count


def find_zip(snapshot_dir: pathlib.Path) -> pathlib.Path | None:
    preferred = list(snapshot_dir.rglob("ASL_Citizen.zip"))
    if preferred:
        return preferred[0]
    zips = list(snapshot_dir.rglob("*.zip"))
    return zips[0] if zips else None


def loose_video_index(snapshot_dir: pathlib.Path) -> dict[str, pathlib.Path]:
    return {path.name: path for path in snapshot_dir.rglob("*.mp4")}


def selected_rows(rows: Iterable[ClipRow], max_per_sign: int | None) -> list[ClipRow]:
    if max_per_sign is None:
        return list(rows)

    counts: dict[tuple[str, str], int] = {}
    selected: list[ClipRow] = []
    for row in rows:
        key = (row.split, row.sign_id)
        if counts.get(key, 0) >= max_per_sign:
            continue
        counts[key] = counts.get(key, 0) + 1
        selected.append(row)
    return selected


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-id", required=True, help="Hugging Face dataset repo ID")
    parser.add_argument("--revision", default=None)
    parser.add_argument("--cache-dir", default=".cache/asl-citizen-hf")
    parser.add_argument("--out", default="data/keypoints.jsonl")
    parser.add_argument("--sign-ids", nargs="+", default=None)
    parser.add_argument("--sign-ids-file", default=None)
    parser.add_argument("--fps", type=int, default=10)
    parser.add_argument("--max-per-sign", type=int, default=None)
    parser.add_argument("--min-detected-ratio", type=float, default=0.3)
    parser.add_argument("--hand-landmarker", default="data/hand_landmarker.task")
    args = parser.parse_args()
    load_runtime_dependencies()

    root = repo_root()
    vocab = parse_vocab(root / "src/data/vocab.ts")
    sign_ids = read_sign_ids(args, vocab)
    gloss_map = build_gloss_map(vocab, set(sign_ids))

    cache_dir = pathlib.Path(args.cache_dir).expanduser()
    snapshot_dir = pathlib.Path(
        snapshot_download(
            repo_id=args.repo_id,
            repo_type="dataset",
            revision=args.revision,
            local_dir=cache_dir,
            allow_patterns=["*.csv", "*.mp4", "*.zip"],
        )
    )

    rows = selected_rows(load_split_rows(snapshot_dir, gloss_map), args.max_per_sign)
    print(f"Selected {len(rows)} clips for {len(sign_ids)} sign IDs: {', '.join(sign_ids)}")

    model_path = (root / args.hand_landmarker).resolve()
    if not model_path.exists():
        raise FileNotFoundError(f"MediaPipe hand landmarker not found: {model_path}")

    out_path = (root / args.out).resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)

    options = HandLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=str(model_path)),
        num_hands=1,
        min_hand_detection_confidence=0.4,
        running_mode=RunningMode.IMAGE,
    )

    videos = loose_video_index(snapshot_dir)
    zip_path = find_zip(snapshot_dir)
    saved = skipped = 0

    with HandLandmarker.create_from_options(options) as detector, out_path.open("w") as out:
        if zip_path:
            with zipfile.ZipFile(zip_path) as zf, tempfile.TemporaryDirectory() as tmp:
                members = {pathlib.Path(name).name: name for name in zf.namelist() if name.endswith(".mp4")}
                tmp_video = pathlib.Path(tmp) / "clip.mp4"
                for row in tqdm(rows, unit="clip"):
                    member = members.get(pathlib.Path(row.video_file).name)
                    if member is None:
                        skipped += 1
                        continue
                    tmp_video.write_bytes(zf.read(member))
                    vectors, frame_count = extract_keypoints(tmp_video, detector, args.fps)
                    ratio = len(vectors) / frame_count if frame_count else 0.0
                    if ratio < args.min_detected_ratio:
                        skipped += 1
                        continue
                    out.write(json.dumps({
                        "sign_id": row.sign_id,
                        "gloss": row.gloss,
                        "split": row.split,
                        "clip_id": pathlib.Path(row.video_file).stem,
                        "source_video": row.video_file,
                        "n_frames": frame_count,
                        "detected_frames": len(vectors),
                        "keypoints": vectors,
                    }) + "\n")
                    saved += 1
        else:
            for row in tqdm(rows, unit="clip"):
                video_path = videos.get(pathlib.Path(row.video_file).name)
                if video_path is None:
                    skipped += 1
                    continue
                vectors, frame_count = extract_keypoints(video_path, detector, args.fps)
                ratio = len(vectors) / frame_count if frame_count else 0.0
                if ratio < args.min_detected_ratio:
                    skipped += 1
                    continue
                out.write(json.dumps({
                    "sign_id": row.sign_id,
                    "gloss": row.gloss,
                    "split": row.split,
                    "clip_id": video_path.stem,
                    "source_video": str(video_path.relative_to(snapshot_dir)),
                    "n_frames": frame_count,
                    "detected_frames": len(vectors),
                    "keypoints": vectors,
                }) + "\n")
                saved += 1

    print(f"Saved {saved} clips to {out_path}")
    print(f"Skipped {skipped} clips")


if __name__ == "__main__":
    main()
