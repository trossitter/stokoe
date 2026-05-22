# Stokoe — ASL 1 Vocabulary Tutor

Browser-based practice tool: prompt a word → learner signs into webcam → custom CV model returns pass/fail + a targeted hint. No pretrained models of any kind (see constraint below).

Named for **William Stokoe** (1919–2000), whose 1960 monograph *Sign Language Structure* proved ASL is a natural language with its own phonology.

## Quick start

```bash
npm install
npm run dev      # localhost:5173
npm run build    # tsc + vite build → dist/
```

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 + TypeScript + Tailwind v4 + Vite |
| Webcam | `MediaDevices.getUserMedia` — frames stay local |
| Inference | ONNX Runtime Web (team-trained weights only) |
| Training | PyTorch offline → export to ONNX |
| Auth / progress | localStorage (Supabase if real auth needed) |

## The one hard constraint

**No pretrained models** — no hand detectors, no pose estimators, no ImageNet backbones. The team owns architecture, dataset, and weights end-to-end. ONNX Runtime Web and classical CV (color segmentation, optical flow) are allowed as frameworks.

## How classification works

1. Fixed ROI overlay guides the learner to position hands in frame.
2. Skin-color presence check (YCbCr/HSV) confirms hands are visible before recording.
3. CNN (3 conv blocks, 64×64 RGB crops) + LSTM over frame sequence → softmax over vocabulary.
4. Diff between expected and observed sign primitives (handshape, movement, location, orientation) drives the hint text.

**Dataset:** ASL Citizen — 83,399 clips, 2,731 signs, 52 signers — filtered to the target vocabulary.

## Privacy

Frames are processed locally and never uploaded (hard requirement). No raw video is persisted — only derived state (pass/fail, attempt counts, mastery).

## Docs

- `ARCHITECTURE.md` — decisions and tradeoffs
- `RESEARCH.md` — dataset and method synthesis
- `VOCABULARY.md` — target sign list
- `docs/` — extended references
