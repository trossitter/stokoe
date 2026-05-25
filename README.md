# Stokoe — ASL 1 Vocabulary Tutor

Browser-based practice tool: prompt a word → learner signs into webcam → rule-based Stokoe notation verifier + ONNX handshape classifier returns pass/fail + a targeted hint.

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
| Hand tracking | MediaPipe Hands (landmarker WASM) |
| Handshape inference | ONNX Runtime Web (team-trained MLP weights) |
| Auth / progress | localStorage |

## How classification works

1. Fixed ROI overlay guides the learner to position hands in frame.
2. Skin-color presence check (HSV) confirms hands are visible; triggers automatic recording.
3. MediaPipe detects 21-point hand landmarks per frame.
4. Three Stokoe notation parameters are verified independently:
   - **Tab (location):** rule-based wrist y vs. estimated face bounds
   - **Dez (handshape):** team-trained ONNX MLP on normalized 21-landmark vector
   - **Sig (movement):** pattern matching on wrist trajectory (circular, tap, forward, etc.)
5. Pass requires 2 of 3 parameters correct. Failed parameter drives hint text.

**Dataset:** ASL Citizen — 83,399 clips, 2,731 signs, 52 signers — filtered to target vocabulary.

## Navigation

- **Hand swipe right** → next sign
- **Hand swipe left** → previous sign
- **Mouse drag** (60px threshold) → same as hand swipe, desktop fallback
- **Buttons** → Try again / Next sign (always available)
- Swipe confirmation: brief directional flash (→/←) before navigation

## Privacy

Frames are processed locally and never uploaded. No raw video is persisted — only derived state (pass/fail, attempt counts, mastery).

## Docs

- `ARCHITECTURE.md` — decisions, tradeoffs, UX design notes
- `RESEARCH.md` — dataset and method synthesis
- `VOCABULARY.md` — target sign list
- `docs/` — extended references
