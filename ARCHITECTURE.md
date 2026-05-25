# Stokoe — Architecture

Updated 2026-05-25.

## Constraint history

**Original constraint (sessions 1–5):** No pretrained models of any kind — ruled out MediaPipe, TF.js Handpose, and ImageNet backbones. **Lifted 2026-05-24** when partners explicitly allowed MediaPipe. The Stokoe notation verifier approach (Tab / Dez / Sig) remains the classification strategy; MediaPipe now handles hand landmark extraction.

## Architecture decisions

| Layer | Decision |
|---|---|
| Hand localization | Circular ROI guide (48% radius of frame) |
| Presence trigger | Skin-color blob detection (HSV) — auto-starts recording |
| Hand landmarks | MediaPipe Hands WASM (21 keypoints per frame) |
| Tab (location) | Rule-based: wrist y vs. estimated face bounding region |
| Dez (handshape) | Team-trained ONNX MLP on normalized 21-landmark vector |
| Sig (movement) | Pattern matching on wrist trajectory (circular, tap, forward…) |
| Pass logic | **All 3 parameters must pass** |
| Navigation | Hand swipe + gesture poses (thumbs-up / open-5) + mouse drag |
| Reference video | WLASL-sourced MP4s served locally, 63 signs |

## Classification pipeline

```
frames (ImageData[])
  → per-frame: MediaPipe landmarks → 21 (x,y,z) keypoints
  → Tab:  wrist y vs. face region heuristic → pass/fail + hint
  → Dez:  ONNX MLP(21 normalized landmarks) → handshape class → pass/fail + hint
  → Sig:  wrist trajectory over clip → movement pattern match → pass/fail + hint
  → 3-of-3 required → result { passed, hintKey, confidence }
```

## UI / UX design

### Onboarding carousel

6 panels: Welcome → Parameters → Feedback preview → Camera permission → Framing check → Swipe to begin. Dark Drift palette (OKLCH), Newsreader headings, MoteField particle background. Hand-swipe navigation activates on panels 5–6 once the camera stream is open. A lightline progress bar and pip indicators track position. Completing panel 6 triggers a 1800 ms handoff splash before dropping into the practice loop.

### Practice loop

Same Drift aesthetic carries through (MoteField background, dark glass panels). Two-column layout: left = SignPrompt + WebcamView and SignVideo side by side. Right = FeedbackPanel.

### Reference video panel

Autoplays on every sign change (`key={item.id}` remount resets playback). Speed slider: 0.25×–1×. After signing, the recording plays beside the reference ("Your attempt"). Panel toggled via "Hide ref" / "Show ref" in the header.

### Camera

Always circular (`clip-path: circle(50%)`). Irises to 34% during result review — signals reviewing mode without hiding the feed entirely. 0.45 s cubic-bezier transition. ROI guide is a circle arc (not a rectangle), radius = 48% of the shorter ROI side. State-coloured ring: white (idle), green (detecting), amber (countdown), red (recording).

### Scoring overlay

Full-screen Drift overlay during evaluation. 4-stage progress bar. Status messages cycle: "Reading your handshape…" → "Checking location…" → "Analyzing movement…" → "Scoring your sign…". Minimum display time 2400 ms so feedback feels considered, not instant.

### Gesture navigation

`useGestureNav` runs during result state. Thumbs-up held 900 ms → next sign. Open-5 hand held 900 ms → retry. 1500 ms lockout after each fire prevents double-trigger. GestureHint renders pill chips (👍 Next / ✋ Retry) with an SVG dwell arc inside the camera circle showing fill progress.

### Hand swipe navigation

`useHandSwipe` during result state. Right swipe → next sign. Left swipe → previous sign. 300 ms swipe flash (→ / ←) confirms the gesture before the UI advances. Mouse drag 60 px threshold as desktop fallback. Detection constants:

```
DISPLACE_THRESHOLD = 0.28    net x-movement in 400 ms window
TRACK_WINDOW_MS    = 400
DIRECTION_PURITY   = 2       |dx| must be ≥ 2× |dy| — filters diagonal waves
FLICK_VELOCITY     = 0.0012  px/ms, right swipe only
```

### User flows

LoginScreen (Drift palette). New user → 6-panel onboarding carousel → practice loop. Power user → WelcomeSplash (1800 ms warm handshake) → practice loop directly. `?reset` URL param clears localStorage for demo restart.

## Pedagogical design

Each prompted sign carries full Stokoe notation metadata (Tab + Dez + Sig + orientation + readable description). The diff between expected and observed notation parameter drives hint text. Hints are rule-based strings — no LLM. Targeted hints are only possible because the architecture decomposes signs into named parameters; a black-box classifier can only say right/wrong.

The Stokoe ASCII notation is visible in the UI (slate tile below the sign name, StokoeTempo font) as a quiet reference, not a pass/fail signal.

| Parameter | What's checked | Hint style |
|---|---|---|
| Handshape (Dez) | ONNX classifier match | Describe correct hand configuration |
| Movement (Sig) | Trajectory pattern | Describe the motion |
| Location (Tab) | Wrist height vs. body region | Tell learner where to position |
| Framing | Hand visible in ROI | Remind learner to center hand |

Pass logic: **all 3 parameters must pass.**

## Privacy model

- Frames processed and classified locally — never uploaded.
- No raw video persisted; only derived state (pass/fail, attempt counts, mastery, recent history).
- MediaPipe inference runs fully in-browser via WASM.

## Testing

| File | Coverage |
|---|---|
| `src/model/notationVerifier.test.ts` | Tab / Sig / Dez unit tests (16 cases) |
| `src/store/progress.test.ts` | Data store (20 cases) |
| `src/hooks/useGestureNav.test.ts` | isThumbsUp / isOpenFive (10 cases) |
| `src/model/signClassifier.test.ts` | Classifier integration |

Run: `npm run test`

## Open work

| Item | Status |
|---|---|
| Onboarding panel 7 — gesture nav tutorial | Designed, not built |
| Returning user stats view | Designed, not built |
| Face landmarks for Tab verifier | Heuristic-only; face landmarks would improve accuracy |
| Avatar (kalidokit + Three.js) | Scoped, not built |
