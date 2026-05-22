# Implementation Notes — Challenges & Operational Discoveries

Decisions and friction points discovered during build, after the research phase.
Intended for demo documentation and future development handoff.

---

## UX: Post-Fail Context Switch (open)

**What was discovered:**
The retry loop creates a forced body-context switch. After a failed attempt the student must: stop signing → shift attention to UI → locate and click "Try Again" → re-establish signing position → mentally re-engage with the sign. This compounds with the existing physical constraint (correct distance from camera, hand in ROI box) and adds a face-confrontation moment (user leans in, sees themselves). The result is a pattern that interrupts the very motor-memory cycle the app is trying to build.

**Root cause:**
The app's two input modalities — presence trigger (hands-free, body-forward) and button click (UI-forward, body-back) — are in conflict. The presence trigger is correct for the practice mode; the retry button belongs to a different interaction paradigm.

**Proposed resolution (not yet implemented):**
Replace the retry button with presence-as-implicit-retry:
- After fail + hint display (~2.5s), presence trigger reactivates silently
- Hand still in frame → countdown begins, retry starts automatically
- Hand leaves frame → "Lower your hand to move on / raise to retry" prompt appears
- No button, no click, no body position break

The student who wants to retry never touches anything. The student who wants to skip does what is natural: drops their hand.

---

## ML: ONNX Export — PyTorch Dynamo Strips Weights (resolved)

**What happened:**
PyTorch 2.12 introduced a new dynamo-based ONNX exporter as the default path. On export, the resulting `.onnx` file was 1.6 KB instead of ~68 KB — the weights were not embedded. The graph structure was valid (ONNX checker passed) but inference produced garbage output.

**Resolution:**
Pass `dynamo=False` to `torch.onnx.export()` to force the legacy TorchScript exporter. This is now set in `scripts/train_dez.py`. The exported model is 68 KB and produces correct inference.

**Note for future re-training:**
`onnxscript` must be installed before export (`pip install onnxscript`). The PyTorch dynamo path imports it at export time; without it the export crashes before the weight-stripping issue can even manifest.

---

## ML: MediaPipe API Breaking Change (resolved)

**What happened:**
`mediapipe==0.10.x` removed the legacy `mp.solutions.hands` API. Existing keypoint extraction script (`extract_keypoints.py`) crashed immediately on import with `AttributeError: module 'mediapipe' has no attribute 'solutions'`.

**Resolution:**
Rewrote extraction to use the MediaPipe Tasks API (`mediapipe.tasks.python.vision.HandLandmarker`). Required downloading the `hand_landmarker.task` model file (~7.5 MB) separately. New script: `scripts/extract_keypoints_from_frames.py`.

---

## UX: Webcam Privacy (resolved)

**What was discovered:**
Showing the full camera feed in practice mode made students self-conscious — they were staring at their own face and background rather than focusing on the sign. The original 40% dimming outside the ROI was insufficient.

**Resolution:**
Outside-ROI dimming raised to 93% opacity. Students see only the hand through the ROI window; face and background are effectively invisible. Tutorial overlay uses `blur(24px) brightness(0.6)` — heavy enough that faces are unrecognisable while the translucent aesthetic is preserved.

---

## Data: Frame Resolution vs. Detection Quality

**What was discovered:**
ASL Citizen videos were center-cropped and downsampled to 64×64 for storage efficiency. MediaPipe hand detection requires reasonable resolution; at 64×64 detection rates dropped substantially (many clips returned zero landmarks).

**Resolution:**
Before running MediaPipe, each frame is upscaled to 256×256 using bilinear interpolation. Detection rates recovered to acceptable levels. The upscaling adds no meaningful information but satisfies the model's spatial resolution requirement.
