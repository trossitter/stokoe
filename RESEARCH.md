# Stokoe: Pre-Planning Research Synthesis
## Browser-Based ASL Vocabulary Tutor — From-Scratch Computer Vision

---

### What This Project Is

Stokoe is a browser-based ASL vocabulary tutor for college ASL 1 learners. A student sees a word, signs it into their webcam, and the app returns pass/fail plus a targeted hint about what went wrong — handshape, movement, location, orientation, timing, or framing. The vocabulary scope is 75–100 isolated beginner signs.

The load-bearing constraint that shapes every decision: **no pretrained models of any kind.** MediaPipe Hands, TensorFlow.js Handpose, BlazePose, any ImageNet-pretrained backbone — all off the table. The team must own the architecture and the weights. This is unusual in 2025, where nearly every published ASL recognition system leans on MediaPipe for hand keypoint extraction before doing anything else. Stokoe has to solve the problem differently.

This document synthesizes research across four areas: available training data, hand localization approaches, model architectures, and browser deployment constraints.

---

### The Training Data Landscape

The richest freely available dataset for this project is **ASL Citizen**, released by Microsoft Research at NeurIPS 2023. It contains 83,399 video clips of 2,731 distinct signs, performed by 52 signers who filmed themselves in everyday environments — not a lab. That ecological validity matters: the app will be used by students at home, not under controlled lighting. The dataset maps to ASL-LEX, a linguistically analyzed lexicon of about 2,700 signs that includes phonological metadata: handshape codes, movement descriptors, location tags, and orientation labels. That metadata is directly useful for writing the pedagogical hints the spec requires.

The other major dataset is **WLASL** (Word-Level ASL), with 21,083 videos across 2,000 signs from 119 signers. The catch: WLASL links to YouTube URLs, and a significant fraction are dead. Real recoverable count is closer to 12,000–14,000 clips. The WLASL100 subset — the 100 most common signs — is the standard academic benchmark for isolated sign recognition and appears in dozens of papers.

**ASLLVD** (American Sign Language Lexicon Video Dataset, Boston University) covers 3,300+ signs with rich linguistic annotations, but only 1–6 signers per sign. Useful for supplementary reference; low signer diversity limits its value for training a generalizable model.

**The critical data risk:** ASL Citizen averages about 30 videos per sign. Common ASL 1 vocabulary words will be over-represented, but even optimistically the target 75–100 signs might have 30–80 clips each. The published literature shows that from-scratch CNN+LSTM models on WLASL100 — which has roughly 310 videos per class — achieve 48–56% top-1 accuracy. With potentially 10× less data per class, accuracy will be lower. This is not a reason to abandon the project; the spec explicitly requires documented accuracy targets and confidence thresholds. Honest documentation of a pilot under controlled conditions is the deliverable, not a production-grade recognizer. The academic baseline with pretrained weights achieves 65–80% on the same task — so the honest from-scratch number with limited data might be 40–60%, and that needs to be stated plainly.

**Recommended dataset strategy:** Filter ASL Citizen to the target 75–100 signs using ASL-LEX as the vocabulary selection guide. Prioritize signs with distinctive motion profiles over signs that differ only in subtle hand configuration details. Supplement with data augmentation: horizontal mirror (creates a second version of each clip), time-stretch, speed jitter. Restrict the initial pipeline to 50 signs if per-class sample counts are dangerously low.

---

### The Hand Localization Problem

This is the question that no one in the published literature has to answer the hard way, because everyone uses MediaPipe. Without it, you need to tell the classifier where the hands are in the frame. Four options exist.

**Option 1: Fixed ROI overlay.** Draw two guide rectangles on the webcam canvas and instruct the user to position their hands inside them before signing. No detection at all. Computationally free. Several published demos use exactly this approach. The downside is that it asks the user to align themselves deliberately, which feels less polished than automatic detection. For a documented pilot under controlled conditions, this is not a real downside — it is a documented constraint.

**Option 2: Skin color segmentation.** Convert each webcam frame to YCbCr and HSV color spaces, apply pixel thresholds for skin tones, and find the largest skin-colored blob as the hand region. Works well under consistent lighting for lighter and medium skin tones; achieves 91–96% skin-pixel recall in lab conditions. Fails under colored or variable lighting and performs worse on darker complexions. Requires per-user calibration to be reliable across diverse skin tones. Feasible in the browser using the Canvas API with no libraries. Good as a secondary check — confirming that hands are present in the ROI — not as the primary localization mechanism.

**Option 3: Background subtraction and frame differencing.** Capture a background frame with no hands present. Compute pixel-difference between current frame and background. Threshold the result to isolate moving objects — i.e., hands. Lighting-independent relative to skin tone; works for any complexion. Requires a static background and camera stability. Falls apart in messy home environments. Feasible in JavaScript, with opencv.js providing ready implementations.

**Option 4: Train a tiny hand detector from scratch.** Technically possible but impractical in a one-week sprint. Requires a labeled bounding-box dataset and a separate training pipeline before any sign classifier work can begin.

**Recommendation:** Fixed ROI overlay as the primary mechanism, with a skin-color presence check as secondary confirmation that hands are in the frame before recording begins. This eliminates the detection problem entirely, lets all engineering effort go into the classifier, and is honest about the controlled conditions the pilot operates under.

---

### Model Architecture

The recommended architecture is a **small 2D CNN applied per-frame, followed by an LSTM over the frame sequence, ending in a softmax classifier.**

Concretely: each frame from the fixed ROI is resized to 64×64 pixels. A three-block convolutional network (32 → 64 → 128 channels, each block followed by pooling and batch normalization) extracts a feature vector from each frame. Those feature vectors feed into an LSTM that learns the temporal structure of the sign — the movement trajectory, the timing, the transitions between handshapes. The LSTM output feeds a fully connected layer and softmax over the sign vocabulary.

Why this architecture over alternatives? A 3D CNN (which processes the full video volume at once) is more accurate in principle but sample-hungry. It needs thousands of examples per class to converge from random weights; with 30–80 clips per class, it will overfit badly. The CNN+LSTM architecture can learn visual features per-frame with far less data and adds temporal modeling on top. A pure frame-level CNN with mean pooling ignores temporal order entirely — bad for signs that differ only in motion direction or timing. HOG features plus a simple classifier are fast and require no training for the feature extractor, but they lose fine-grained motion information and accuracy drops sharply above 30 sign classes.

**Input representation:** Raw RGB crops from the fixed ROI are the simplest starting point. Optical flow — computing per-pixel motion vectors between consecutive frames — encodes motion directly and reduces what the model must learn from scratch. The tradeoff: computing dense optical flow in the browser in real time is expensive (50–200ms per frame pair at 64×64). The practical path is to train on optical flow computed offline in Python, then decide at inference whether to compute it live in the browser or use a simpler motion representation.

**Target model size:** 3–8MB in FP32. With INT8 quantization, 2–4MB. Well within browser budget.

---

### Browser Deployment

**Export path:** Train in Keras (TensorFlow). Export using `tensorflowjs_converter --input_format=keras`. This is the most reliable path for models with LSTM layers. PyTorch to ONNX to onnxruntime-web (WASM) also works and is the right choice if training happens in PyTorch, but LSTM export requires careful handling of dynamic axes.

**Inference latency:** A clip-level CNN+LSTM forward pass (1–3 million parameters) on the WASM backend takes 100–300ms. On the WebGL backend (WebGPU in newer browsers), 30–100ms. Both are acceptable for a UX where the user signs, waits briefly, and sees a result.

**Model load time:** A 3–8MB model loads in under 3 seconds on a decent connection. INT8 quantization halves this. The onnxruntime-web WASM runtime itself is 6–8MB compressed — a one-time load cached by the browser.

**Key precedent:** The SLAIT AI system (arXiv 2507.00248) trains a from-scratch DNN on geometric hand features — no pretrained backbone — and achieves 92% accuracy on 343 signs with under 10ms inference in the browser. Their hand features come from MediaPipe (off-limits here), but the architectural lesson is powerful: a simple classifier trained on the right features dramatically outperforms a complex classifier trained on raw pixels. The fixed ROI crop, combined with normalized pixel statistics or even basic HOG-style features computed from the crop, may be the right trade-off between feature richness and training data requirements.

---

### The Three Decisions That Unlock Planning

**Vocabulary selection.** Which 75–100 signs? The choice determines whether ASL Citizen has adequate per-class coverage and whether the signs are distinctive enough to tell apart from scratch. Signs with whole-arm motion (HELP, PLEASE, THANK-YOU, WHERE) are more learnable from scratch than fingerspelling or signs that differ only in finger configuration (B vs. D vs. F). ASL-LEX phonological metadata can guide this selection systematically.

**Sign boundary trigger.** When does the app start and stop recording the clip to classify? A held button while signing is simplest and most controllable. Auto-trigger via motion detection (frame differencing) is more natural but adds a detection layer. A fixed 2-second window after a "go" signal is the easiest to implement but least forgiving of timing variation. This decision directly affects classification accuracy.

**Training compute.** Colab free tier (T4 GPU) can train a small CNN+LSTM on 8,000 clips in a few hours. Colab Pro or a local GPU cuts iteration time significantly, which matters when you need to run multiple training experiments to hit the accuracy targets the spec requires.

---

### Honest Summary

This is a hard project. The "no pretrained models" constraint is genuinely unusual and closes off the approaches that make every comparable project in the literature work. The data situation is tight. Accuracy from scratch on 75–100 classes with limited per-class data will be meaningful but modest — call it 40–65% depending on vocabulary selection and pipeline quality.

None of that is disqualifying. The spec calls for a documented pilot with honest accuracy reporting, known failure modes, and documented confidence thresholds. A working system that clearly communicates its limitations is the right deliverable. The fixed ROI + CNN+LSTM + Keras/TFJS pipeline is buildable in a week by an engineer who knows the stack. The research has been done. The architecture is decided. What remains is vocabulary selection, sign boundary UX, and training infrastructure.
