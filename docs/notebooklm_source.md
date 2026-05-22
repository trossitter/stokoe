# Stokoe — Project Source for NotebookLM
*Compiled 2026-05-22. Use this as the single source upload.*

---

## What It Is

Stokoe is a browser-based ASL vocabulary tutor built for iPad. A student faces their camera, the system watches their hand, and gives them real feedback on whether they signed correctly — not just pass/fail, but which phonological parameter was off and how to fix it.

The name is for William Stokoe, the linguist who proved in 1960 that American Sign Language is a true language with its own grammar, and who developed the notation system the app is built on.

---

## The Problem It Solves

Existing ASL learning apps treat signs the way early music-recognition apps treated chords: pattern-match against a known correct signal, return yes or no. That doesn't help a learner. They know they were wrong. They need to know *why* they were wrong — was it their hand position, their handshape, or their movement?

Stokoe gives that answer. It watches three specific parameters (location, handshape, movement), evaluates each one, and returns the exact hint the student needs.

---

## The Hard Constraint: No Pretrained Sign Models

The system was built without any pretrained sign recognition models. This is not a philosophical position — it's a practical one. Pretrained sign models are trained on specific signers in specific conditions, and they are notoriously brittle outside those conditions. Building from scratch on a curated slice of the ASL Citizen dataset gives the system a known performance envelope and a documented dataset provenance.

What *is* used: MediaPipe's hand landmark detector. This is explicitly not a sign model — it returns 21 normalized 3D keypoints describing the position of every joint in the hand. It has no knowledge of ASL vocabulary whatsoever.

---

## How It Works: The Stokoe Notation Verifier

Every sign in the vocabulary is encoded in Stokoe notation — a formal system with three parameters:

**Tab** — where the hand is located relative to the body (forehead, chin, chest, neutral space). Evaluated with rule-based logic using the wrist's position relative to face landmarks.

**Dez** — the handshape. There are 15 handshape categories in Stokoe's system (flat hand, spread hand, index finger, curved, fist, etc.). Evaluated by a 3-layer MLP trained from scratch on 9,561 extracted landmark frames from the ASL Citizen dataset. The model classifies hand geometry, not signs.

**Sig** — the movement. Circular, contact/tap, forward, toward, upward, downward, wrist-twist, side-to-side, static hold. Evaluated with rule-based motion pattern detection on the wrist trajectory across the recording window.

Pass logic: 2 of 3 parameters satisfied = pass. This is deliberately generous — the goal is to catch bad habits, not to punish approximation.

---

## The Dataset

**ASL Citizen** (Lee et al., 2023) — 83,399 video clips, 2,731 signs, 52 Deaf adult signers recording in naturalistic home settings. Creative Commons Attribution 4.0.

From this, 1,956 clips were curated for the app's 63-sign vocabulary. The original ASL Citizen train/val/test participant splits were preserved to prevent data leakage.

The vocabulary was not selected by asking "which signs are easiest." It was selected by phonological coverage — choosing signs that maximize coverage of distinct Tab, Dez, and Sig combinations. This makes the training set maximally informative for the classifier.

Key quantitative result from the selection defense: THREE and FOUR have a phonological similarity of 1.000 — they are phonologically identical except for one finger. This is exactly the kind of hard case the system needs to handle. The numbers cluster is the tightest in the dataset (mean similarity 0.770), making it the hardest cluster for the model.

---

## The Model Performance

- 15 Stokoe Dez (handshape) classes
- Training frames: 9,561 / Validation: 2,003 / Test: 7,669
- Test accuracy: 60.1%
- Majority-class baseline: ~24%
- Validation accuracy at training end: 64.8% (epoch 35 best)

60% accuracy on 15 handshape categories, trained from scratch in 40 epochs on consumer hardware. Sufficient for pedagogical feedback — the 2-of-3 pass rule absorbs Dez misclassifications for signs where location and movement are clearly correct.

---

## The User Experience

**Onboarding:** The splash screen asks for a name and presents two modes: Power User (skip the tutorial) and New User (take the primer). New users go through a four-card swipe tutorial. The camera runs immediately and warms up behind a frosted overlay. Each card has a distinct pastel color (lavender → mint → rose → amber) that deepens as you advance. Cards are swiped with the hand, not the finger — a rightward wrist trajectory triggers the advance. Mouse click also works for accessibility.

**Practice:** Signs are presented in randomized order. The camera shows only the hand through a narrow ROI window — 93% of the frame outside the ROI is blacked out so students aren't staring at their own face. The presence trigger is hands-free: place your hand in the box and hold still, it starts automatically after a short countdown.

**Feedback on fail:** The hint and correct parameters appear as an overlay inside the camera view at the bottom of the frame — not in a side panel. Students stay in signing position to read the feedback. Swipe right to advance to the next sign.

---

## Implementation Challenges

**Post-fail context switch (open):** When a student fails, they currently have to click a "Try Again" button, which breaks their signing posture. The proposed fix is presence-as-implicit-retry: if the hand stays in frame after the result, the presence trigger reactivates and retry begins. Hand leaving frame = choice to move on. Not yet implemented.

**PyTorch ONNX export:** PyTorch 2.12 changed its default ONNX exporter to a dynamo path that produces a 1.6 KB stub instead of the 68 KB model with embedded weights. Fixed with `dynamo=False`.

**MediaPipe API break:** `mediapipe==0.10.x` removed the `mp.solutions` API entirely. Extraction script rewritten to use the Tasks API with a downloaded model file.

**Webcam privacy:** Students were self-conscious seeing their own face. Fixed by raising outside-ROI dimming from 40% to 93% opacity. Tutorial blur raised to 24px + 60% brightness reduction.

**64×64 frame resolution:** ASL Citizen frames were stored at 64×64. MediaPipe requires reasonable resolution for landmark detection. Fixed by upscaling to 256×256 before detection.

---

## File Structure

```
stokoe/
  src/
    components/
      LoginScreen.tsx     — splash + mode selection
      SwipeTutorial.tsx   — onboarding cards with hand detection
      WebcamView.tsx      — camera + ROI + presence trigger
      SignPrompt.tsx      — word display + result buttons
      FeedbackPanel.tsx   — progress tracker (right panel)
      CameraHint.tsx      — fail/pass overlay on camera feed
    hooks/
      useHandSwipe.ts     — shared rightward swipe detector
      usePresenceTrigger.ts — hands-free recording trigger
      useWebcam.ts        — camera setup
    model/
      handLandmarker.ts   — MediaPipe singleton loader
      signClassifier.ts   — orchestrates detection + verification
      notationVerifier.ts — Tab/Dez/Sig rule + MLP evaluator
      dezPredictor.ts     — ONNX runtime loader for Dez MLP
    data/
      vocab.ts            — 63 signs with params + hints
      notation.ts         — Stokoe ASCII notation per sign
  scripts/
    curate.py             — extract clips from ASL Citizen zip
    extract_keypoints_from_frames.py — MediaPipe on stored frames
    train_dez.py          — PyTorch MLP → ONNX
    train_pipeline.sh     — end-to-end: extract → train → deploy
  docs/
    pilot_documentation.md
    defense_vocabulary_selection.md
    implementation_notes.md
    stokoe_notation_reference.md
  presentation/
    stokoe-narratives/    — standalone ASL fairy tale presentation
```

---

## What's Left

1. Presence-as-implicit-retry (the post-fail context switch fix)
2. Swipe-right confirmation step in practice mode
3. Demo video
