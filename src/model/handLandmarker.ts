import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

let _landmarker: HandLandmarker | null = null;
let _loading: Promise<HandLandmarker> | null = null;

type Delegate = "GPU" | "CPU";

const DELEGATES: Delegate[] = ["GPU", "CPU"];
const LOCAL_ASSETS = {
  wasmRoot: "/wasm",
  modelAssetPath: "/hand_landmarker.task",
};
const CDN_ASSETS = {
  wasmRoot: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm",
  modelAssetPath:
    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
};

function getAssetSets() {
  const isLocalHost =
    typeof location !== "undefined" &&
    (location.hostname === "localhost" ||
      location.hostname === "127.0.0.1" ||
      location.hostname === "::1");

  return isLocalHost ? [LOCAL_ASSETS, CDN_ASSETS] : [CDN_ASSETS, LOCAL_ASSETS];
}

async function createHandLandmarker() {
  let lastError: unknown = null;

  for (const assets of getAssetSets()) {
    let vision: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>;

    try {
      vision = await FilesetResolver.forVisionTasks(assets.wasmRoot);
    } catch (error) {
      lastError = error;
      continue;
    }

    for (const delegate of DELEGATES) {
      try {
        return await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: assets.modelAssetPath, delegate },
          numHands: 1,
          minHandDetectionConfidence: 0.3,
          minHandPresenceConfidence: 0.2,
          runningMode: "IMAGE",
        });
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw lastError ?? new Error("Unable to load MediaPipe hand landmarker.");
}

export async function getHandLandmarker(): Promise<HandLandmarker> {
  if (_landmarker) return _landmarker;
  if (_loading) return _loading;

  _loading = createHandLandmarker()
    .then((landmarker) => {
      _landmarker = landmarker;
      return landmarker;
    })
    .catch((error) => {
      _loading = null;
      throw error;
    });

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
