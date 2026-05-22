import * as ort from "onnxruntime-web";

type DezMeta = {
  dez_labels: string[];
};

let _session: ort.InferenceSession | null = null;
let _labels: string[] | null = null;
let _loading: Promise<boolean> | null = null;

async function load(): Promise<boolean> {
  try {
    const [session, meta] = await Promise.all([
      ort.InferenceSession.create("/model/dez/dez_classifier.onnx", {
        executionProviders: ["wasm"],
      }),
      fetch("/model/dez/dez_meta.json").then((r) => r.json() as Promise<DezMeta>),
    ]);
    _session = session;
    _labels = meta.dez_labels;
    return true;
  } catch {
    return false;
  }
}

// Returns a predictor function if the ONNX model is available, null otherwise.
// Graceful — the verifier operates without Dez when model isn't deployed yet.
export async function getDezPredictor(): Promise<((landmarks: Float32Array) => Promise<string>) | null> {
  if (!_loading) _loading = load();
  const ok = await _loading;
  if (!ok || !_session || !_labels) return null;

  const session = _session;
  const labels = _labels;

  return async (landmarks: Float32Array): Promise<string> => {
    const tensor = new ort.Tensor("float32", landmarks, [1, 63]);
    const output = await session.run({ landmarks: tensor });
    const logits = output["logits"].data as Float32Array;
    let maxIdx = 0;
    for (let i = 1; i < logits.length; i++) {
      if (logits[i] > logits[maxIdx]) maxIdx = i;
    }
    return labels[maxIdx];
  };
}
