import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

let _landmarker: HandLandmarker | null = null;
let _loading: Promise<HandLandmarker> | null = null;

export async function getHandLandmarker(): Promise<HandLandmarker> {
  if (_landmarker) return _landmarker;
  if (_loading) return _loading;

  _loading = (async () => {
    const vision = await FilesetResolver.forVisionTasks("/wasm");
    _landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: "/hand_landmarker.task", delegate: "GPU" },
      numHands: 1,
      minHandDetectionConfidence: 0.3,
      minHandPresenceConfidence: 0.2,
      runningMode: "IMAGE",
    });
    return _landmarker;
  })();

  return _loading;
}

// Upscale an ImageData to a canvas and detect hand landmarks.
// Returns null if no hand detected.
export async function detectLandmarks(
  frame: ImageData,
): Promise<Array<{ x: number; y: number; z: number }> | null> {
  const landmarker = await getHandLandmarker();

  // Upscale 64×64 → 256×256 for better detection
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = frame.width;
  tmpCanvas.height = frame.height;
  tmpCanvas.getContext("2d")!.putImageData(frame, 0, 0);
  ctx.drawImage(tmpCanvas, 0, 0, 256, 256);

  const result = landmarker.detect(canvas);
  if (!result.landmarks || result.landmarks.length === 0) return null;
  return result.landmarks[0] as Array<{ x: number; y: number; z: number }>;
}
