// TODO: load and run the team-trained sign classifier in the browser.
// Per spec (Requirement 7), no pretrained models — weights and architecture
// must be produced by this project. This module will expose:
//   - loadModel(): Promise<SignClassifier>
//   - classify(frames): Promise<{ label: string; confidence: number }>
// Pass/fail decisions (Requirement 9) compare confidence against documented
// per-sign thresholds defined alongside the trained model artifact.
export type SignPrediction = {
  label: string;
  confidence: number;
};

export async function classifyAttempt(
  _frames: ImageData[],
): Promise<SignPrediction | null> {
  // Placeholder until the trained model artifact exists.
  return null;
}
