# Stokoe — ASL 1 Vocabulary Tutor

Browser-based practice tool: sign into your webcam → rule-based Stokoe notation verifier + ONNX handshape classifier returns pass/fail and a targeted hint. Named for **William Stokoe** (1919–2000), whose 1960 monograph proved ASL is a natural language with its own phonology.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run test
```

> Add `?reset` to the URL to clear localStorage for a clean demo restart.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 + TypeScript + Tailwind v4 + Vite |
| Hand tracking | MediaPipe Hands (WASM, 21-point landmarks, runs fully in-browser) |
| Handshape inference | ONNX Runtime Web (team-trained MLP on normalized 21-landmark vector) |
| Design system | Drift — Newsreader + JetBrains Mono, OKLCH palette |
| Reference video | WLASL dataset (63 signs sourced, served locally) |
| Auth / progress | localStorage — no backend |

## Classification

Signs are evaluated against three Stokoe notation parameters. **All 3 must pass.**

- **Tab (location):** rule-based — wrist y vs. estimated face bounding region
- **Dez (handshape):** team-trained ONNX MLP on normalized 21-landmark vector
- **Sig (movement):** pattern matching on wrist trajectory (circular, tap, forward, etc.)

The failed parameter drives the hint — a black-box classifier can only say right/wrong; decomposing into named parameters makes targeted feedback possible.

## Navigation

- **Hand swipe right / left** → next / previous sign (active during result state)
- **Thumbs up** held 900 ms → next sign
- **Open-5 hand** held 900 ms → retry
- **Mouse drag** 60 px threshold → same as hand swipe (desktop fallback)
- Swipe confirmation: 300 ms directional flash (→ / ←) before the UI advances

## Reference video

63 ASL reference videos (WLASL dataset) play automatically beside the webcam. Speed slider: 0.25×–1×. After you sign, your recording plays beside the reference for direct comparison. Toggle with "Hide ref" / "Show ref" in the header.

## Privacy

Frames are processed locally and never uploaded. No raw video is persisted — only derived state (pass/fail, attempt counts, mastery).

## Docs

- `ARCHITECTURE.md` — decisions, pipeline, UX design notes
- `RESEARCH.md` — dataset and method synthesis
- `VOCABULARY.md` — target sign list
