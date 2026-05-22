import { detectLandmarks } from "./handLandmarker";
import { verifyNotation } from "./notationVerifier";
import type { KeypointFrame } from "./notationVerifier";
import { getDezPredictor } from "./dezPredictor";
import { NOTATION } from "../data/notation";

export type HintKey = "handshape" | "movement" | "location" | "orientation" | "framing";

export type SignPrediction = {
  passed: boolean;
  confidence: number;
  hintKey: HintKey | null;
};

const PARAM_TO_HINT: Record<string, HintKey> = {
  tab: "location",
  dez: "handshape",
  sig: "movement",
  framing: "framing",
};

// Pre-warm Dez predictor on first import so it's ready when needed
getDezPredictor().catch(() => {});

export async function classifyAttempt(
  frames: ImageData[],
  signId: string,
): Promise<SignPrediction> {
  const notation = NOTATION[signId];
  if (!notation) {
    return { passed: false, confidence: 0, hintKey: "framing" };
  }

  const [keypointFrames, dezPredictor] = await Promise.all([
    Promise.all(
      frames.map(async (frame, i): Promise<KeypointFrame> => {
        const landmarks = await detectLandmarks(frame);
        return { landmarks, timestamp: i * 100 };
      }),
    ),
    getDezPredictor(),
  ]);

  const result = await verifyNotation(keypointFrames, notation, dezPredictor, null);

  const hintKey: HintKey | null = result.failedParameter
    ? (PARAM_TO_HINT[result.failedParameter] ?? null)
    : null;

  return { passed: result.passed, confidence: result.confidence, hintKey };
}
