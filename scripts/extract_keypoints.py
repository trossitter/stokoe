"""
extract_keypoints.py — Extract MediaPipe Hands landmarks from curated video clips.

Reads each .mp4 from ASL_Citizen.zip for our target vocabulary,
runs MediaPipe Hands per frame, saves normalized landmark sequences.

Output per clip: data/keypoints/<split>/<gloss>/<clip_id>.npy
  shape: (n_frames, 63) float32
  63 = 21 landmarks × 3 (x, y, z)
  Normalized: wrist at origin, hand scale = 1 (middle-finger MCP distance)

Also writes data/keypoints_manifest.csv with columns:
  split, gloss, clip_id, n_frames, hand_detected_ratio

Usage:
  python3 scripts/extract_keypoints.py \
    --zip ~/ASL_Citizen.zip \
    --out ~/GauntletAI/partner-projects/stokoe/data
"""

import argparse
import csv
import pathlib
import tempfile
import zipfile

import cv2
import mediapipe as mp
import numpy as np
from tqdm import tqdm

mp_hands = mp.solutions.hands

WRIST = 0
MIDDLE_MCP = 9


def normalize_landmarks(landmarks) -> np.ndarray:
    """Return (21, 3) array normalized to wrist-origin, unit hand scale."""
    pts = np.array([[lm.x, lm.y, lm.z] for lm in landmarks], dtype=np.float32)
    origin = pts[WRIST].copy()
    pts -= origin
    scale = np.linalg.norm(pts[MIDDLE_MCP]) + 1e-6
    pts /= scale
    return pts.flatten()  # (63,)


def extract_from_video(video_path: str, target_fps: int = 10) -> tuple[list[np.ndarray], float]:
    cap = cv2.VideoCapture(video_path)
    src_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    step = max(1, round(src_fps / target_fps))

    frames_bgr = []
    idx = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        if idx % step == 0:
            frames_bgr.append(frame)
        idx += 1
    cap.release()

    if not frames_bgr:
        return [], 0.0

    landmarks_seq = []
    detected = 0

    with mp_hands.Hands(
        static_image_mode=True,
        max_num_hands=2,
        min_detection_confidence=0.4,
    ) as hands:
        for bgr in frames_bgr:
            rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
            result = hands.process(rgb)
            if result.multi_hand_landmarks:
                # Use the first (most confident) detected hand
                lm = result.multi_hand_landmarks[0]
                landmarks_seq.append(normalize_landmarks(lm.landmark))
                detected += 1
            else:
                # No hand detected — append zeros (model learns to handle missing frames)
                landmarks_seq.append(np.zeros(63, dtype=np.float32))

    detected_ratio = detected / len(frames_bgr) if frames_bgr else 0.0
    return landmarks_seq, detected_ratio


# ── Vocabulary gloss map (mirrors curate.py) ──────────────────────────────────
GLOSS_TO_LABEL = {
    "HELLO": "HELLO", "BYE": "GOODBYE", "PLEASE": "PLEASE",
    "THANKYOU": "THANK YOU", "SORRY": "SORRY", "YES": "YES", "NO": "NO",
    "GOOD": "GOOD", "BAD": "BAD", "ONE": "ONE", "TWO": "TWO",
    "THREE": "THREE", "FOUR": "FOUR", "HAPPY": "HAPPY", "SIX": "SIX",
    "SEVEN": "SEVEN", "EIGHT": "EIGHT", "NINE": "NINE", "RED": "RED",
    "BLUE": "BLUE", "GREEN": "GREEN", "YELLOW": "YELLOW", "ORANGE": "ORANGE",
    "PURPLE": "PURPLE", "BLACK": "BLACK", "WHITE": "WHITE",
    "MOTHER": "MOTHER", "FATHER": "FATHER", "SISTER": "SISTER",
    "BROTHER": "BROTHER", "BABY1": "BABY", "FAMILY": "FAMILY",
    "EAT1": "EAT", "DRINK1": "DRINK", "WANT1": "WANT", "LIKE": "LIKE",
    "LOVE": "LOVE", "HELP": "HELP", "KNOW": "KNOW", "UNDERSTAND": "UNDERSTAND",
    "GO": "GO", "COME": "COME", "SEE": "SEE", "LEARN": "LEARN",
    "SLEEP": "SLEEP", "TIRED": "TIRED", "ME": "ME", "YOU": "YOU",
    "WATER": "WATER", "HOME": "HOME", "SCHOOL": "SCHOOL", "BOOK": "BOOK",
    "NAME": "NAME", "WHAT1": "WHAT", "WHERE": "WHERE", "WHO": "WHO",
    "HOW1": "HOW", "WHY": "WHY", "BIG": "BIG", "SMALL": "SMALL",
    "HOT": "HOT", "COLD": "COLD", "STOP": "STOP",
}


def load_splits(data_dir: pathlib.Path):
    needed = {}  # filename → (split, label)
    for split in ["train", "val", "test"]:
        with open(data_dir / f"{split}.csv") as f:
            for row in csv.DictReader(f):
                g = row["Gloss"].strip().upper()
                if g in GLOSS_TO_LABEL:
                    fname = row["Video file"].strip()
                    needed[fname] = (split, GLOSS_TO_LABEL[g])
    return needed


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--zip", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--fps", type=int, default=10)
    parser.add_argument("--min_detect", type=float, default=0.3,
                        help="Minimum hand detection ratio to keep a clip")
    args = parser.parse_args()

    zip_path = pathlib.Path(args.zip).expanduser()
    out_dir = pathlib.Path(args.out).expanduser()
    kp_dir = out_dir / "keypoints"

    needed = load_splits(out_dir)
    print(f"Target clips: {len(needed)}")

    manifest_rows = []
    skipped = 0

    with tempfile.TemporaryDirectory() as tmp:
        tmp_video = pathlib.Path(tmp) / "clip.mp4"

        with zipfile.ZipFile(zip_path) as zf:
            members = [m for m in zf.namelist() if m.endswith(".mp4")]
            for member in tqdm(members, desc="Extracting keypoints", unit="clip"):
                fname = pathlib.Path(member).name
                if fname not in needed:
                    continue

                split, label = needed[fname]
                clip_id = pathlib.Path(fname).stem

                save_path = kp_dir / split / label / f"{clip_id}.npy"
                if save_path.exists():
                    arr = np.load(save_path)
                    manifest_rows.append({
                        "split": split, "gloss": label,
                        "clip_id": clip_id, "n_frames": arr.shape[0],
                        "hand_detected_ratio": "cached",
                    })
                    continue

                save_path.parent.mkdir(parents=True, exist_ok=True)
                tmp_video.write_bytes(zf.read(member))

                landmarks, ratio = extract_from_video(str(tmp_video), args.fps)

                if len(landmarks) < 4 or ratio < args.min_detect:
                    skipped += 1
                    continue

                arr = np.stack(landmarks, axis=0)  # (n_frames, 63)
                np.save(save_path, arr)
                manifest_rows.append({
                    "split": split, "gloss": label,
                    "clip_id": clip_id, "n_frames": arr.shape[0],
                    "hand_detected_ratio": round(ratio, 3),
                })

    manifest_path = out_dir / "keypoints_manifest.csv"
    with open(manifest_path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["split", "gloss", "clip_id", "n_frames", "hand_detected_ratio"])
        w.writeheader()
        w.writerows(manifest_rows)

    print(f"\nDone. {len(manifest_rows)} clips saved, {skipped} skipped (low detection).")
    print(f"Manifest: {manifest_path}")
    kp_size = sum(p.stat().st_size for p in kp_dir.rglob("*.npy")) / 1e6
    print(f"Keypoint data size: {kp_size:.1f} MB")


if __name__ == "__main__":
    main()
