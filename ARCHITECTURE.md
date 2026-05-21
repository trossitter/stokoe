# Stokoe — Architecture (Draft)

> _Draft, 2026-05-18. Several decisions pending clarification from Patrick on Requirement 7. Document expected to evolve substantially._

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

## Strategic paths (one to be chosen pending Patrick's clarification)

**Open question to Patrick (sent 2026-05-18):** _Does Requirement 7 prohibit using a pretrained landmark detector (e.g., MediaPipe Hands) as an offline labeling tool during dataset preparation, even when no pretrained component appears in the inference pipeline?_

| Path | Approach | Tractable in a week? |
|---|---|---|
| **A. Color-marker / glove (Thalia's 2018 lineage)** | Learner wears provided colored fingertips. OpenCV color segmentation → from-scratch temporal classifier on tracked positions. | Yes. Most realistic. |
| **B. Bare-hand, end-to-end from scratch** | Small CNN + temporal head on raw frames, random init. Requires substantial self-collected data. | Marginal. |
| **C. Own landmark detector + classifier on top** | Two from-scratch models stacked. "Right" in spirit, very hard in the time. | No. |

If Patrick allows MediaPipe for **offline labeling only**, a fourth path opens: bare-hand inference distilled from MediaPipe-labeled training data, with no pretrained component shipped to the learner. Still hard, but feasible.

**Default plan, pending Patrick:** Path A, with the gloves framed as part of the documented controlled conditions (Requirement 8 explicitly permits this).

## Tech stack

| Layer | Tech | Role |
|---|---|---|
| **Frontend** | React 19 + TypeScript + Tailwind v4 + Vite | Practice UI: prompt, webcam preview, attempt state, result, hint, retry. |
| **Webcam capture** | `MediaDevices.getUserMedia` | Frames stay local (Requirement 13). |
| **CV preprocessing** | OpenCV.js (no pretrained models inside it) | Color segmentation, contour tracking for Path A. |
| **Inference runtime** | TF.js or ONNX Runtime Web | Runs team-trained weights only. |
| **Training** | PyTorch on personal / Colab GPU | Off-browser. Exports to ONNX or TFJS format. |
| **Accounts + progress** | TBD (localStorage minimum; Supabase if Patrick wants real auth) | Awaiting clarification. |

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

- Patrick's answer on Requirement 7 (offline labeling): determines Path A vs. distilled-bare-hand path.
- Dataset scope: single signer (Thalia) vs. multi-signer pilot.
- Validation split: held-out clips of training signers vs. held-out signers entirely. (Very different accuracy stories.)
- Auth: localStorage vs. real auth.
- Vocabulary list: which 75–100 ASL 1 items, prioritized by linguistic tractability (distinct handshapes, body-anchored locations, asymmetric two-hand signs deferred).

## Out of scope

Multi-language sign support, full ASL conversation recognition, sentence/phrase translation, teacher/admin portals, classroom rostering, SSO, server-side video inference as default, raw video upload, pretrained CV models of any kind, research-grade bias analysis.

## Personal context

Thalia did ASL CV research in 2018 with a glove-based prototype. 
