/**
 * notationVerifier.ts — Stokoe notation verifier using MediaPipe + ONNX dez classifier.
 *
 * Architecture:
 *   Tab  — rule-based: hand position relative to MediaPipe face/body anchors
 *   Dez  — ONNX MLP: 21 normalized landmarks → handshape category
 *   Sig  — rule-based: motion pattern detection over landmark sequence
 *
 * Pass logic: at least two of three parameters must pass. Stokoe evaluates the
 * sign's structure rather than trying to recognize a whole-sign label. If the
 * Dez model is unavailable, dezPassed defaults to true (so Tab + Sig are the
 * effective gatekeepers).
 */

import type { NotationEntry } from "../data/notation";

export type ParameterResult = {
  parameter: "tab" | "dez" | "sig" | "framing";
  passed: boolean;
  confidence: number;
  hint: string;
};

export type VerificationResult = {
  passed: boolean;
  confidence: number;
  failedParameter: "tab" | "dez" | "sig" | "framing" | null;
};

// ── Landmark types (mirrors MediaPipe output) ─────────────────────────────────

type Landmark = { x: number; y: number; z: number };
type HandLandmarks = Landmark[];  // 21 landmarks

// Frame data passed in from WebcamView
export type KeypointFrame = {
  landmarks: HandLandmarks | null;
  timestamp: number;
};

// ── Normalization ─────────────────────────────────────────────────────────────

function normalizeLandmarks(lm: HandLandmarks): Float32Array {
  const WRIST = 0;
  const MIDDLE_MCP = 9;
  const pts = lm.map(p => [p.x, p.y, p.z]);
  const origin = pts[WRIST];
  const centered = pts.map(p => [p[0] - origin[0], p[1] - origin[1], p[2] - origin[2]]);
  const scale = Math.hypot(...centered[MIDDLE_MCP]) || 1;
  const normalized = centered.map(p => p.map(v => v / scale));
  return new Float32Array(normalized.flat());
}

// ── Tab (location) verifier ───────────────────────────────────────────────────
// ASCII tab codes → body region check rules
// Uses normalized hand position relative to face bounding box
// face_top/bottom/left/right are fractions of frame height/width

function checkTab(
  handLm: HandLandmarks,
  faceLm: Landmark[] | null,
  expectedTab: string,
): ParameterResult {
  const wrist = handLm[0];

  // Without face landmarks, use absolute frame position heuristics
  const y = wrist.y;  // 0=top, 1=bottom
  const x = wrist.x;

  let passed: boolean;
  let hint: string;

  const faceTop = faceLm ? Math.min(...faceLm.map(l => l.y)) : 0.1;
  const faceBottom = faceLm ? Math.max(...faceLm.map(l => l.y)) : 0.7;
  const faceMid = (faceTop + faceBottom) / 2;

  switch (expectedTab) {
    case "P":  // forehead/temple
      passed = y < faceMid - 0.05;
      hint = "Bring your hand higher — near your forehead or temple.";
      break;
    case "U":  // chin/lips
      passed = y > faceMid && y < faceBottom + 0.05;
      hint = "Move your hand to chin level.";
      break;
    case "}":  // cheek/temple
      passed = y > faceTop && y < faceBottom && (x < 0.35 || x > 0.65);
      hint = "Position your hand at your cheek or temple.";
      break;
    case "[ ]":  // chest/trunk
      passed = y > faceBottom;
      hint = "Lower your hand to chest level.";
      break;
    case "Q":  // face/whole head
      passed = y > faceTop - 0.05 && y < faceBottom + 0.1;
      hint = "Keep your hand near your face.";
      break;
    case "0":  // neutral space
    default:
      passed = y > 0.2 && y < 0.9 && x > 0.1 && x < 0.9;
      hint = "Keep your hand in front of you in neutral space.";
      break;
  }

  return {
    parameter: "tab",
    passed,
    confidence: passed ? 0.8 : 0.3,
    hint,
  };
}

// ── Sig (movement) verifier ───────────────────────────────────────────────────

type Axis = "x" | "y";

const REVERSAL_EPS = 0.0001;
const FINGERTIP_INDICES = [4, 8, 12, 16, 20];
const CLOSE_FINGERTIP_INDICES = [8, 12];

function reversalEvents(deltas: number[], axis: Axis): Array<{ axis: Axis; index: number }> {
  const events: Array<{ axis: Axis; index: number }> = [];
  for (let i = 1; i < deltas.length; i++) {
    if (deltas[i] * deltas[i - 1] < -REVERSAL_EPS) {
      events.push({ axis, index: i });
    }
  }
  return events;
}

function countReversals(deltas: number[]): number {
  return reversalEvents(deltas, "x").length;
}

function hasInterleavedReversals(
  xEvents: Array<{ axis: Axis; index: number }>,
  yEvents: Array<{ axis: Axis; index: number }>,
): boolean {
  const ordered = [...xEvents, ...yEvents].sort((a, b) => a.index - b.index);
  const axisRuns = ordered.reduce<Axis[]>((runs, event) => {
    if (runs[runs.length - 1] !== event.axis) runs.push(event.axis);
    return runs;
  }, []);

  return axisRuns.length >= 3 && axisRuns.includes("x") && axisRuns.includes("y");
}

function variance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
}

function averageThumbDistance(landmarks: HandLandmarks): number {
  const thumbTip = landmarks[4];
  return CLOSE_FINGERTIP_INDICES.reduce((sum, index) => {
    const tip = landmarks[index];
    return sum + Math.hypot(tip.x - thumbTip.x, tip.y - thumbTip.y, tip.z - thumbTip.z);
  }, 0) / CLOSE_FINGERTIP_INDICES.length;
}

function checkSig(
  frames: KeypointFrame[],
  expectedSig: string,
): ParameterResult {
  const validFrames = frames.filter(f => f.landmarks !== null);
  if (validFrames.length < 3) {
    return { parameter: "sig", passed: false, confidence: 0.1,
             hint: "Make sure your hand stays visible throughout the sign." };
  }

  const wrists = validFrames.map(f => f.landmarks![0]);

  // Displacement vectors
  const dx = wrists.map((w, i) => i > 0 ? w.x - wrists[i-1].x : 0);
  const dy = wrists.map((w, i) => i > 0 ? w.y - wrists[i-1].y : 0);
  const lateralMovement = dx.reduce((s, v) => s + Math.abs(v), 0);
  const verticalMovement = dy.reduce((s, v) => s + Math.abs(v), 0);
  const totalMovement = lateralMovement + verticalMovement;

  let passed: boolean;
  let hint: string;

  switch (expectedSig) {
    case "D@": {  // circular
      const xEvents = reversalEvents(dx, "x");
      const yEvents = reversalEvents(dy, "y");
      passed = xEvents.length >= 1 &&
               yEvents.length >= 1 &&
               hasInterleavedReversals(xEvents, yEvents) &&
               totalMovement > 0.03;
      hint = "Make a circular motion — your hand should trace a circle.";
      break;
    }
    case "Dx": case "Dx·": {  // contact / tap
      passed = totalMovement > 0.015 && totalMovement < 0.15;
      hint = "Tap or touch the target location.";
      break;
    }
    case "Df": {  // forward / outward
      const netForward = wrists[wrists.length-1].x - wrists[0].x;
      passed = Math.abs(netForward) > 0.04 || totalMovement > 0.04;
      hint = "Move your hand forward or outward.";
      break;
    }
    case "Dt": {  // toward signer
      const netToward = -(wrists[wrists.length-1].x - wrists[0].x);
      passed = netToward > 0.03 || totalMovement > 0.04;
      hint = "Pull your hand toward your body.";
      break;
    }
    case "D^": {  // upward
      const netUp = wrists[0].y - wrists[wrists.length-1].y;
      passed = netUp > 0.03;
      hint = "Move your hand upward.";
      break;
    }
    case "Dv": {  // downward
      const netDown = wrists[wrists.length-1].y - wrists[0].y;
      passed = netDown > 0.03;
      hint = "Move your hand downward.";
      break;
    }
    case "Dg": {  // wrist twist
      // Detect palm orientation change (rough proxy: z variance of fingertips)
      const zVals = validFrames.map(f => f.landmarks![12].z); // middle fingertip
      const zRange = Math.max(...zVals) - Math.min(...zVals);
      passed = zRange > 0.05 || totalMovement > 0.02;
      hint = "Twist or shake your wrist.";
      break;
    }
    case "De": {  // finger wiggle
      const fingertipXs = validFrames.map(f => {
        const landmarks = f.landmarks!;
        const wristX = landmarks[0].x;
        return FINGERTIP_INDICES.reduce((sum, idx) => sum + (landmarks[idx].x - wristX), 0) /
               FINGERTIP_INDICES.length;
      });
      const dTipX = fingertipXs.map((x, i) => i > 0 ? x - fingertipXs[i - 1] : 0);
      passed = countReversals(dTipX) >= 2 &&
               variance(fingertipXs) > 0.00005 &&
               totalMovement < 0.12;
      hint = "Wiggle your fingers while keeping your hand mostly in place.";
      break;
    }
    case "D#": {  // close up / snap fingers closed
      const thumbDistances = validFrames.map(f => averageThumbDistance(f.landmarks!));
      const distanceRange = Math.max(...thumbDistances) - Math.min(...thumbDistances);
      const closesTowardThumb = Math.min(...thumbDistances) < Math.max(...thumbDistances) * 0.72;
      passed = distanceRange > 0.035 && closesTowardThumb;
      hint = "Close your fingers toward your thumb.";
      break;
    }
    case "Dz": {  // side to side
      const lateralReversals = countReversals(dx);
      passed = lateralReversals >= 1 && totalMovement > 0.02;
      hint = "Shake your hand side to side.";
      break;
    }
    case "D%": {  // separate / move apart
      passed = totalMovement > 0.05;
      hint = "Move your hands apart.";
      break;
    }
    case "Dr": {  // nod
      const vertReversals = countReversals(dy);
      passed = vertReversals >= 2 && verticalMovement > 0.02;
      hint = "Nod your hand up and down.";
      break;
    }
    case "Dw": {  // up-down
      const vertReversals = countReversals(dy);
      passed = vertReversals >= 2 &&
               verticalMovement > 0.03 &&
               verticalMovement >= lateralMovement * 1.5;
      hint = "Move your hand up and down.";
      break;
    }
    case "D": {  // static hold
      passed = totalMovement < 0.08;
      hint = "Hold the handshape still — this sign has no movement.";
      break;
    }
    default: {
      // Unknown sig — pass if any movement present (generous)
      passed = totalMovement > 0.01;
      hint = "Perform the sign's movement.";
    }
  }

  return {
    parameter: "sig",
    passed,
    confidence: passed ? 0.75 : 0.25,
    hint,
  };
}

// ── Main verifier ─────────────────────────────────────────────────────────────

export async function verifyNotation(
  frames: KeypointFrame[],
  notation: NotationEntry,
  dezPredictor: ((landmarks: Float32Array) => Promise<string>) | null,
  faceLandmarks: Landmark[] | null,
): Promise<VerificationResult> {

  const validFrames = frames.filter(f => f.landmarks !== null);

  // Framing check — did we see hands at all?
  if (validFrames.length < 2) {
    return {
      passed: false,
      confidence: 0.0,
      failedParameter: "framing",
    };
  }

  // Use middle frame for static checks
  const midFrame = validFrames[Math.floor(validFrames.length / 2)];
  const handLm = midFrame.landmarks!;

  // Tab check
  const tabResult = checkTab(handLm, faceLandmarks, notation.tab);

  // Dez check
  let dezPassed = true;
  let dezConfidence = 0.7;
  if (dezPredictor) {
    const normalized = normalizeLandmarks(handLm);
    const predictedDez = await dezPredictor(normalized);
    dezPassed = predictedDez === notation.dez;
    dezConfidence = dezPassed ? 0.8 : 0.35;
  }

  // Sig check
  const sigResult = checkSig(frames, notation.sig);

  // Pass requires a 2-of-3 majority across the phonological parameters.
  const paramsPassed = [tabResult.passed, dezPassed, sigResult.passed]
    .filter(Boolean).length;

  const passed = paramsPassed >= 2;
  const confidence = (tabResult.confidence + dezConfidence + sigResult.confidence) / 3;

  // Identify which parameter to hint on
  let failedParameter: VerificationResult["failedParameter"] = null;
  if (!passed) {
    if (!tabResult.passed) failedParameter = "tab";
    else if (!dezPassed) failedParameter = "dez";
    else failedParameter = "sig";
  }

  return { passed, confidence, failedParameter };
}
