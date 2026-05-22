export type HintKey = "handshape" | "movement" | "location" | "orientation" | "framing";

export type SignPrediction = {
  passed: boolean;
  confidence: number;
  hintKey: HintKey | null; // null on pass
};

// Mock classifier — returns a plausible result after a short delay.
// Replace this function body when the trained TFJS model artifact lands in public/model/.
// The real implementation will:
//   1. Load the TFJS model (once, cached)
//   2. Preprocess frames: crop to ROI, resize to 64×64, normalise
//   3. Run inference: CNN per frame → LSTM → softmax
//   4. Compare predicted label + confidence against per-sign thresholds
//   5. Return hintKey derived from which parameter score was lowest
export async function classifyAttempt(
  _frames: ImageData[],
  _signId: string,
): Promise<SignPrediction> {
  // Simulate inference latency
  await new Promise((r) => setTimeout(r, 1200));

  const confidence = 0.45 + Math.random() * 0.5; // 0.45 – 0.95
  const passed = confidence >= 0.72;

  const hintKeys: HintKey[] = ["handshape", "movement", "location", "orientation", "framing"];
  const hintKey: HintKey | null = passed
    ? null
    : hintKeys[Math.floor(Math.random() * hintKeys.length)];

  return { passed, confidence, hintKey };
}
