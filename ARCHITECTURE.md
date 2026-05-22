# Stokoe — Architecture (Draft)

> _Updated 2026-05-21. Architecture confirmed; dataset confirmed as ASL Citizen. See RESEARCH.md for full synthesis._

## What this is

Stokoe is a browser-based ASL 1 vocabulary tutor for college learners. Prompt a word → learner signs into webcam → custom CV model returns pass/fail + a targeted hint. The pilot covers 75–100 isolated beginner signs under documented conditions.

Code name honors **William Stokoe** (1919–2000), whose 1960 monograph *Sign Language Structure* proved ASL is a natural language with its own phonology — pre-Stokoe, ASL was officially treated as broken English on the hands. The naming pays the field its founding debt.

## The load-bearing constraint

**Requirement 7: no pretrained models of any kind.** This includes pretrained sign classifiers, hand or pose landmark detectors, feature extractors, and general-purpose CV backbones. The team must own architecture, dataset, and weights end-to-end.

Rules out:
- MediaPipe Hands / `@mediapipe/tasks-vision`
- TF.js Handpose / `@tensorflow-models/hand-pose-detection`
- BlazePose
- Any ImageNet-pretrained CNN as a feature extractor

Does *not* rule out:
- TensorFlow.js or ONNX Runtime Web as **framework** (running team-trained weights)
- Classical CV preprocessing (color segmentation, edge detection, optical flow)
- PyTorch for offline training, exported to ONNX for in-browser inference

## Architecture decision (confirmed 2026-05-21)

**Constraint resolved:** Requirement 7 prohibits pretrained models at inference. Frameworks and classical CV (color segmentation, optical flow) are allowed. Pretrained weights as an offline labeling tool were considered and ruled out — the team owns everything end-to-end.

**Chosen approach:** Fixed ROI overlay (two guide rectangles) as the primary hand localization mechanism, backed by a skin-color presence check to confirm hands are in frame before recording. Sign classifier is a small 2D CNN per frame + LSTM over the frame sequence, trained from scratch on ASL Citizen, exported to TF.js or ONNX Runtime Web.

| Layer | Decision |
|---|---|
| **Hand localization** | Fixed ROI overlay — user positions hands in guide rectangles; no detector needed. |
| **Presence check** | Skin-color blob detection (YCbCr/HSV) — secondary signal before recording starts. |
| **Classifier** | CNN (32→64→128 channels, 3 blocks) + LSTM + softmax. Trained on ASL Citizen filtered to target vocabulary. |
| **Input** | 64×64 RGB crops from fixed ROI. Optical flow computed offline for training; simple motion rep at inference. |
| **Target size** | 3–8 MB FP32; 2–4 MB INT8. |
| **Inference latency** | 100–300 ms (WASM); 30–100 ms (WebGL/WebGPU). |
| **Training data** | ASL Citizen (83,399 clips, 2,731 signs, 52 signers). Filter to 75–100 target vocabulary. |

## Tech stack

| Layer | Tech | Role |
|---|---|---|
| **Frontend** | React 19 + TypeScript + Tailwind v4 + Vite | Practice UI: prompt, webcam preview, attempt state, result, hint, retry. |
| **Webcam capture** | `MediaDevices.getUserMedia` | Frames stay local (Requirement 13). |
| **CV preprocessing** | OpenCV.js (no pretrained models inside it) | Color segmentation, contour tracking for Path A. |
| **Inference runtime** | TF.js or ONNX Runtime Web | Runs team-trained weights only. |
| **Training** | PyTorch on personal / Colab GPU | Off-browser. Exports to ONNX or TFJS format. |
| **Accounts + progress** | localStorage minimum; Supabase if real auth is needed | Awaiting vocabulary selection. |

## Privacy model

- Frames are captured, processed locally, **never uploaded** by default (Requirement 13).
- No raw video persistence; only derived state (pass/fail, attempt counts, mastery, recent history).
- The architecture leaves a server-side inference interface possible (Requirement 5) but never the default.
- Future data-collection (if proposed) requires explicit consent flow, documented separately.

## Pedagogical hints (Requirement 10)

Rule-based, tied to observable sign primitives — each prompted sign carries metadata describing the expected pattern, and the diff between observed and expected drives the hint text:

- **Handshape** — was the configured handshape correct?
- **Movement** — was the trajectory right?
- **Location** — was the sign placed correctly (chest, forehead, neutral space)?
- **Orientation** — palm facing the right direction?
- **Timing** — too fast / too slow?
- **Framing** — was the hand inside the camera frame?

## Open decisions

- **Vocabulary selection:** which 75–100 ASL 1 signs? Use ASL-LEX to prioritize signs with distinctive motion profiles; defer fingerspelling and configuration-only distinctions.
- **Sign boundary trigger:** held button while signing (simplest, most controllable) vs. auto-trigger via frame differencing vs. fixed 2-second window after a "go" signal.
- **Training compute:** Colab free (T4) vs. Colab Pro vs. local GPU — affects iteration speed across multiple training experiments.
- **Validation split:** held-out clips of training signers vs. held-out signers entirely. (Very different accuracy stories.)
- **Auth:** localStorage vs. Supabase real auth.

## Out of scope

Multi-language sign support, full ASL conversation recognition, sentence/phrase translation, teacher/admin portals, classroom rostering, SSO, server-side video inference as default, raw video upload, pretrained CV models of any kind, research-grade bias analysis.

## Personal context

Thalia did ASL CV research in 2018 with a glove-based prototype. Path A is a return to that lineage with seven more years of tooling, framed not as a compromise but as a principled application of the spec's Controlled Pilot Quality clause.
