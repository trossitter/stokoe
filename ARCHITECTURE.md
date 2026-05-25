# Stokoe — Architecture

> Updated 2026-05-24. Partners lifted the no-pretrained-models constraint; MediaPipe now fully allowed. See RESEARCH.md for dataset synthesis.

## Constraint history

**Original constraint (sessions 1–5):** No pretrained models of any kind. Ruled out MediaPipe, TF.js Handpose, ImageNet backbones.

**Lifted 2026-05-24:** Partners explicitly allowed MediaPipe. The architecture below reflects the post-lift design. The Stokoe notation verifier approach (Tab/Dez/Sig) remains the classification strategy; MediaPipe is used for hand landmark extraction.

## Architecture decisions

| Layer | Decision |
|---|---|
| **Hand localization** | Fixed ROI — user positions hands in guide rectangle |
| **Presence trigger** | Skin-color blob detection (HSV) — auto-starts recording |
| **Hand landmarks** | MediaPipe Hands landmarker WASM (21 keypoints per frame) |
| **Tab (location)** | Rule-based: wrist y vs. estimated face bounding region |
| **Dez (handshape)** | Team-trained ONNX MLP on normalized 21-landmark vector |
| **Sig (movement)** | Pattern matching on wrist trajectory (circular, tap, forward…) |
| **Pass logic** | All 3 parameters must pass — learners pass when they sign correctly |
| **Navigation** | Hand swipe left/right via MediaPipe wrist tracking |

## Classification pipeline (per attempt)

```
frames (ImageData[])
  → per-frame: MediaPipe landmarks → 21 (x,y,z) keypoints
  → Tab:  wrist y vs. face region heuristic → pass/fail + hint
  → Dez:  ONNX MLP(21 normalized landmarks) → handshape class → pass/fail + hint
  → Sig:  wrist trajectory over clip → movement pattern match → pass/fail + hint
  → 2-of-3 majority → result { passed, hintKey, confidence }
```

## Pedagogical design

Each prompted sign carries full Stokoe notation metadata (Tab + Dez + Sig + orientation + readable description). The diff between expected and observed notation parameter drives hint text. Hints are rule-based strings — no LLM.

The Stokoe notation is now **visible to the learner** in the UI (slate tile below the sign name, StokoeTempo font). It's a quiet reference, not a pass/fail signal.

| Parameter | What's checked | Hint style |
|---|---|---|
| Handshape (Dez) | ONNX classifier match | Describe correct hand config |
| Movement (Sig) | Trajectory pattern | Describe the motion |
| Location (Tab) | Wrist height vs. body region | Tell learner where to position |
| Orientation | Palm direction (future) | Tell learner which way palm faces |
| Framing | Hand visible in ROI | Remind learner to center hand |

## UI / UX design

### Navigation

Single-swipe bidirectional navigation. The two-stage confirm gate (sessions 1–5) was retired in session 6 — the higher displacement threshold (0.28) and direction-purity filter (|dx| ≥ 2×|dy|) make single swipes reliable enough.

- **Right swipe** → next sign
- **Left swipe** → previous sign
- Both hand gestures (palm-forward swipe, back-of-hand wave) work — the tracker uses wrist x-position, which moves regardless of hand orientation
- **Swipe flash:** a brief directional circle (→/←) overlaid on camera for 300 ms confirms the gesture before the UI advances
- **Mouse drag fallback:** 60 px drag threshold on the main container (desktop only)

### Swipe detection internals (`useHandSwipe.ts`)

```
DISPLACE_THRESHOLD = 0.28    (net x-movement in 400ms window)
TRACK_WINDOW_MS    = 400
DIRECTION_PURITY   = 2       (|dx| must be ≥ 2× |dy| — filters diagonal waves)
FLICK_VELOCITY     = 0.0012  (px/ms, right swipe only)
```

### Camera shutter

During **result review**, the camera view irises to a circle (`clip-path: circle(60% at 50% 50%)`). This signals "reviewing mode" and reduces the face-visibility discomfort without completely hiding the feed. The camera reopens on idle/next sign (0.45s cubic-bezier transition).

The 60% radius keeps the CameraHint panel (bottom-anchored) visible inside the circle on typical screen sizes.

### Notation tile

The Stokoe ASCII notation (e.g., `P5<Df`) is rendered in StokoeTempo font on a `#1e293b` (slate-800) tile below the sign name in SignPrompt. Color: `#cbd5e1` (slate-300). The `title` attribute exposes the plain-English readable description on hover.

## Avatar — future session

With MediaPipe now allowed, a full 3D avatar driven by body landmarks is feasible:

- `@mediapipe/holistic` — hands + pose in one pass
- `kalidokit` — maps landmarks to bone rotations (eliminates inverse-kinematics work)
- `three.js` + VRM/GLTF avatar (ReadyPlayerMe free tier or VRoid Hub)
- Rendered to a `<canvas>` that replaces the `<video>` element — classification pipeline reads from the same canvas; no downstream changes needed

This removes the face-visibility discomfort entirely. Estimated effort: ~2 days. Scope for a dedicated session.

## Privacy model

- Frames processed and classified locally — never uploaded.
- No raw video persisted; only derived state (pass/fail, attempt counts, mastery, recent history).
- MediaPipe inference runs fully in-browser via WASM.

## Open work

| Item | Status |
|---|---|
| Dez ONNX model (team-trained handshape) | Weights needed — training pipeline exists |
| Sig pattern coverage | Core patterns implemented; complex motions (nod, wiggle) rule-based |
| SwipeTutorial copy | Still describes two-stage confirm — needs update |
| Avatar | Scoped, not built |
| Demo video | Not recorded |
