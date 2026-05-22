# Stokoe — Architecture

> Updated 2026-05-21. Dataset confirmed as ASL Citizen. See RESEARCH.md for full synthesis.

## Load-bearing constraint

**No pretrained models of any kind** — no sign classifiers, no hand/pose detectors, no ImageNet backbones, no feature extractors. The team owns architecture, dataset, and weights end-to-end.

Ruled out: MediaPipe Hands, TF.js Handpose, BlazePose, any pretrained CNN backbone.

Allowed: TF.js / ONNX Runtime Web as inference *frameworks* (running team-trained weights), classical CV (color segmentation, edge detection, optical flow), PyTorch for offline training.

## Architecture decisions

Fixed ROI overlay (two guide rectangles) is the primary hand localization mechanism — no detector needed. Skin-color presence check (YCbCr/HSV) confirms hands are in frame before recording starts. Classifier is a small CNN + LSTM trained from scratch on ASL Citizen, exported to ONNX for in-browser inference.

| Layer | Decision |
|---|---|
| **Hand localization** | Fixed ROI — user positions hands in guide rectangles |
| **Presence check** | Skin-color blob detection (YCbCr/HSV) |
| **Classifier** | CNN (32→64→128 channels, 3 blocks) + LSTM + softmax |
| **Input** | 64×64 RGB crops from ROI; optical flow computed offline for training |
| **Model size** | 3–8 MB FP32 / 2–4 MB INT8 |
| **Inference latency** | 100–300 ms (WASM); 30–100 ms (WebGL/WebGPU) |
| **Training data** | ASL Citizen — 83,399 clips, 2,731 signs, 52 signers; filtered to target vocabulary |

## Pedagogical hints

Rule-based, tied to observable sign primitives. Each prompted sign carries metadata; the diff between observed and expected drives hint text.

| Primitive | What's checked |
|---|---|
| Handshape | Configured hand configuration correct? |
| Movement | Trajectory correct? |
| Location | Sign placed at correct body region? |
| Orientation | Palm direction correct? |
| Timing | Too fast / too slow? |
| Framing | Hand inside camera frame? |

## Privacy model

- Frames processed and classified locally — never uploaded by default (hard requirement).
- No raw video persisted; only derived state (pass/fail, attempt counts, mastery, recent history).
- Server-side inference interface is architecturally possible but never the default.
- Any future data collection requires a separate, explicit consent flow.

## Open decisions

| Decision | Options |
|---|---|
| **Vocabulary** | Which 75–100 ASL 1 signs? Use ASL-LEX to prioritize distinctive motion profiles; defer fingerspelling and configuration-only distinctions. |
| **Sign boundary** | Held button (simplest) vs. frame-differencing auto-trigger vs. fixed 2 s window after "go" |
| **Validation split** | Held-out clips of training signers vs. held-out signers entirely (very different accuracy stories) |
| **Auth** | localStorage vs. Supabase |
| **Training compute** | Colab free (T4) vs. Colab Pro vs. local GPU |

## Out of scope

Multi-language sign support, sentence/phrase translation, teacher/admin portals, classroom rostering, SSO, server-side video inference as default, raw video upload, pretrained CV models of any kind, research-grade bias analysis.
