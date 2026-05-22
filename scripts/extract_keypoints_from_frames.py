"""
extract_keypoints_from_frames.py — Run MediaPipe on stored frame images.

Reads (64, 64, 3) uint8 frames from data/frames/, upscales to 256×256,
runs MediaPipe Hands, saves normalized landmark sequences.

Output per clip: data/keypoints/<split>/<gloss>/<clip_id>.npy
  shape: (n_detected_frames, 63) float32
  63 = 21 landmarks × 3 (x, y, z), wrist-origin normalized

Usage:
  python3 scripts/extract_keypoints_from_frames.py \
    --data ~/GauntletAI/partner-projects/stokoe/data
"""

import argparse
import pathlib

import cv2
import mediapipe as mp
from mediapipe.tasks.python import BaseOptions
from mediapipe.tasks.python.vision import HandLandmarker, HandLandmarkerOptions, RunningMode
import numpy as np
from tqdm import tqdm

WRIST = 0
MIDDLE_MCP = 9
UPSCALE = 256


def normalize(landmarks) -> np.ndarray:
    pts = np.array([[lm.x, lm.y, lm.z] for lm in landmarks], dtype=np.float32)
    pts -= pts[WRIST].copy()
    scale = np.linalg.norm(pts[MIDDLE_MCP]) + 1e-6
    pts /= scale
    return pts.flatten()  # (63,)


def process_clip(clip_dir: pathlib.Path, detector) -> np.ndarray:
    frames = sorted(clip_dir.glob("frame_*.npy"))
    vectors = []
    for f in frames:
        img = np.load(f)  # (64, 64, 3) uint8 RGB
        big = cv2.resize(img, (UPSCALE, UPSCALE), interpolation=cv2.INTER_LINEAR)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=big)
        result = detector.detect(mp_image)
        if result.hand_landmarks:
            vectors.append(normalize(result.hand_landmarks[0]))
    return np.array(vectors, dtype=np.float32) if vectors else np.zeros((0, 63), dtype=np.float32)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", required=True)
    args = parser.parse_args()

    data_dir = pathlib.Path(args.data).expanduser()
    frames_dir = data_dir / "frames"
    kp_dir = data_dir / "keypoints"
    model_path = data_dir / "hand_landmarker.task"

    if not model_path.exists():
        raise FileNotFoundError(f"Model not found: {model_path}\nDownload from: https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task")

    clips = list(frames_dir.glob("*/*/*"))
    print(f"Processing {len(clips)} clips...")

    options = HandLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=str(model_path)),
        num_hands=1,
        min_hand_detection_confidence=0.4,
        running_mode=RunningMode.IMAGE,
    )

    detected = skipped = 0
    with HandLandmarker.create_from_options(options) as detector:
        for clip_dir in tqdm(clips, unit="clip"):
            # clip_dir = data/frames/<split>/<gloss>/<clip_id>
            parts = clip_dir.relative_to(frames_dir).parts
            split, gloss, clip_id = parts[0], parts[1], parts[2]

            out_path = kp_dir / split / gloss / f"{clip_id}.npy"
            if out_path.exists():
                detected += 1
                continue

            out_path.parent.mkdir(parents=True, exist_ok=True)
            kps = process_clip(clip_dir, detector)
            np.save(out_path, kps)

            if len(kps) > 0:
                detected += 1
            else:
                skipped += 1

    print(f"\nDone. {detected} clips with detections, {skipped} with no hand detected.")
    print(f"Keypoints at: {kp_dir}")


if __name__ == "__main__":
    main()
