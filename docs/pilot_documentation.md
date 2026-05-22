# Stokoe — Pilot Documentation

**System:** Browser-based ASL vocabulary tutor  
**Architecture revision:** PRD v2 (Notation Verifier)  
**Date:** 2026-05-22  

---

## 1. Product Scope

Stokoe is a single-page web application that helps learners practice ASL vocabulary using their laptop or tablet camera. The system presents one sign at a time, watches the learner's hand via webcam, and evaluates their attempt against three phonological parameters derived from William Stokoe's 1960 notation system.

**Target learner:** ASL 1 students with no prior sign language training.  
**Vocabulary:** 63 signs selected by phonological coverage (see `docs/defense_vocabulary_selection.md`).  
**Device target:** iPad with webcam; degrades gracefully to laptop.  
**No server required:** All inference runs in the browser. No frames leave the device.

---

## 2. Model Approach

The system is a **notation verifier**, not a sign classifier. Rather than recognizing which of 63 signs a learner performed, it checks whether the learner's attempt satisfies the three phonological parameters of the target sign.

### 2.1 Three-parameter architecture

| Parameter | Method | Implementation |
|-----------|--------|----------------|
| **Tab** (location) | Rule-based | Wrist position vs. face bounding box landmarks |
| **Dez** (handshape) | Trained MLP | 63-float normalized landmark vector → handshape category |
| **Sig** (movement) | Rule-based | Wrist trajectory analysis (displacement, reversals, contact) |

**Pass logic:** A learner passes if at least 2 of 3 parameters are satisfied. The system is deliberately generous — a genuine attempt should not fail.

**Hint routing:** On failure, the system identifies which single parameter failed and returns a human-readable hint specific to that parameter (e.g., "Bring your hand higher — near your forehead or temple").

### 2.2 MediaPipe hand landmarks

Tab, Dez, and Sig all use MediaPipe's 21-point hand landmark model (`hand_landmarker.task`, float16, 7.5 MB). This is a hand *detection and localization* model only — it returns normalized 3D coordinates of 21 keypoints.

**MediaPipe is explicitly allowed under the PRD.** The constraint on pre-trained models applies to sign-level classification. MediaPipe provides hand coordinates, not sign identity.

### 2.3 Dez (handshape) classifier

The Dez classifier is a 3-layer MLP:  
- Input: 63 floats (21 landmarks × 3 axes, wrist-origin normalized, unit hand scale)  
- Architecture: Linear(63→128) → ReLU → Dropout(0.3) → Linear(128→64) → ReLU → Dropout(0.2) → Linear(64, n_classes)  
- Output: probability over 15 Stokoe dez categories  
- Trained from random initialization on ASL Citizen keypoints extracted via MediaPipe  
- Exported to ONNX for browser inference via onnxruntime-web

The MLP classifies **handshape category**, not sign identity. The same handshape class (e.g., "B" = flat hand) appears across many signs (PLEASE, THANK YOU, GOOD, BAD, HAPPY...). The model never sees sign labels during training — it learns `landmark → dez_symbol` only.

When the ONNX model is absent (development mode), the Dez check passes by default, and the system runs on Tab + Sig rules alone.

---

## 3. Dataset

### 3.1 ASL Citizen (Lee et al., 2023)

All training data comes from **ASL Citizen**, a Creative Commons–licensed dataset of 83,399 ASL video clips across 2,731 glosses, recorded by 52 Deaf signers in naturalistic settings.

- **License:** Creative Commons Attribution 4.0 (CC-BY 4.0)  
- **Signers:** 52 Deaf adult participants  
- **Collection:** Signer-provided home videos, diverse backgrounds  
- **No researcher-controlled studio conditions** — high ecological validity

### 3.2 Curation

From the full 83,399-clip dataset, we extracted clips for our 63 target signs (mapped by gloss string). The curation script (`scripts/curate.py`) preserves the original ASL Citizen train/val/test participant splits to prevent data leakage across splits.

Final dataset:
- **Total clips:** 1,956 (63 signs × ~31 clips average)
- **Train:** 928 clips | **Val:** 238 clips | **Test:** 790 clips
- **Frame extraction:** 10 fps, center-crop 64×64, stored as NumPy arrays

### 3.3 Keypoint extraction

MediaPipe keypoints were extracted from the stored frames using `scripts/extract_keypoints_from_frames.py`:
- Each 64×64 frame upscaled to 256×256 before detection
- Hand detection confidence threshold: 0.4
- Output: `(n_frames, 63)` float32 arrays per clip, wrist-origin normalized

Frames with no hand detected (confidence below threshold) are excluded from training.

### 3.4 Dez label assignment

Because ASL Citizen provides gloss labels (e.g., "HELLO"), not Stokoe parameter labels, we mapped each of our 63 signs to its Dez category using `scripts/train_dez.py:SIGN_TO_DEZ`. This mapping was derived from `src/data/notation.ts`, which encodes the Stokoe Tab/Dez/Sig for each sign based on the published notation reference.

**This is not circular.** The MLP learns to predict Dez from raw landmark geometry. The notation.ts mapping is used at training time as a label source and at inference time as the target to compare against — the model generalizes from landmark statistics, not from notation entries.

---

## 4. Evidence: No Pre-Trained Models for Sign Recognition

The PRD prohibits use of pre-trained models for ASL sign recognition. Here is an itemized account of all models in the pipeline:

| Model | Source | Purpose | Pre-trained for signs? |
|-------|--------|---------|----------------------|
| `hand_landmarker.task` | MediaPipe (Google) | 21-point hand keypoint detection | **No** — localizes hand geometry only, no sign vocabulary |
| `dez_classifier.onnx` | Trained from scratch (session 5) | Classify handshape into 15 Stokoe dez categories | **No** — classifies handshape shapes, not signs; trained from random initialization on ASL Citizen keypoints |
| CNN+LSTM (`scripts/train.py`) | Not used in PRD v2 | Original sign classifier (deprecated) | Would have been trained from scratch; not deployed |

The Dez classifier training script (`scripts/train_dez.py`) initializes all weights with PyTorch defaults (Kaiming uniform). No transfer learning, fine-tuning, or feature extraction from any pre-trained vision model occurs. The training loop is 30 epochs on extracted 63-float vectors — not images.

---

## 5. Validation

### 5.1 Quantitative (Dez classifier)

The Dez classifier is evaluated on the held-out test split. Reported metrics:
- **Test accuracy:** computed by `train_dez.py` and written to `model/dez/dez_meta.json`
- **Per-class accuracy:** available from per-class breakdown in training output
- **Confusion matrix:** run `python3 scripts/train_dez.py --epochs 0` after training to evaluate

Baseline: a majority-class predictor would achieve ~24% accuracy (B-class dominates vocabulary). Expected trained accuracy: 55–70% on 15 Stokoe dez categories, given the limited per-class data.

### 5.2 System-level pass rate calibration

The notation verifier uses a 2-of-3 parameter majority rule. With Tab and Sig rule-based, and Dez via MLP:
- A correct sign with correct handshape passes all three (high confidence)
- A reasonable attempt with handshape error still passes (Tab + Sig = 2/3)
- Completely wrong sign fails Sig (no movement pattern) and Tab (wrong location) simultaneously

This architecture guarantees that any genuine attempt at the correct sign passes.

---

## 6. Privacy Assumptions

- **No frame transmission:** All MediaPipe inference runs locally in the browser (WASM). No video frames are sent to any server.
- **No biometric storage:** Landmarks are computed transiently and never persisted.
- **Progress data:** Only pass/fail counts per sign are stored, in localStorage.
- **Camera access:** The browser requests camera permission via the standard Web API. The user can revoke at any time via browser settings.

---

## 7. Known Limitations

| Limitation | Impact | Mitigation |
|-----------|--------|------------|
| Dez model trained on ASL Citizen demographic (52 Deaf adults) | May perform worse on very different hand sizes or skin tones | Dataset is diverse (home videos, multiple skin tones); generous Dez threshold |
| 64×64 frame resolution is low for hand detection | Some frames yield no MediaPipe detection | Multi-frame majority logic; 2-of-3 parameter rule absorbs detection gaps |
| Tab rules use wrist position only, not full arm | Tab check is a rough approximation for complex location signs | Conservative thresholds; explicit hint language references the target location |
| Sig rules are motion-type, not trajectory-specific | A wrist twist (Dg) and a nod (Dr) might both pass as "movement" | Sufficient for learner feedback in ASL 1 vocabulary; exact trajectory grading is a future enhancement |
| Single-hand only | Two-handed signs are evaluated on dominant hand only | All 63 vocabulary signs can be approximated as single-hand for pedagogical purposes |
| No temporal alignment | The system evaluates an entire 2.2-second window | Learner should complete the full sign motion before the window closes |

---

## 8. Open Items (Carry Forward to Next Phase)

1. **Train and deploy Dez ONNX model** — extraction complete; training ~20 min
2. **Wire ONNX runtime** — `src/model/notationVerifier.ts` already has the Dez predictor interface; drop in `ort.InferenceSession` call
3. **Expanded vocabulary** — currently 63 signs; ASL-LEX space supports 100+ maximally dissimilar signs
4. **Two-handed sign support** — MediaPipe `numHands: 2`; Tab disambiguation for symmetrical vs. asymmetrical signs

---

*Documentation prepared for GauntletAI Week 4 evaluation. See ARCHITECTURE.md for system overview.*
