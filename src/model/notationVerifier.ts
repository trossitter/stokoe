/**
 * notationVerifier.ts — Stokoe notation verifier using MediaPipe + ONNX dez classifier.
 *
 * Replaces the raw-frame CNN+LSTM approach.
 * Architecture:
 *   Tab  — rule-based: hand position relative to MediaPipe face/body anchors
 *   Dez  — ONNX MLP: 21 normalized landmarks → handshape category
 *   Sig  — rule-based: motion pattern detection over landmark sequence
 *
 * Pass logic (Requirement 7 reinterpreted via notation framework):
 *   - Any genuine attempt (hands visible, reasonable approximation) passes
 *   - Fail only on no interaction or all three parameters completely wrong
 *   - Confidence threshold documented per-sign (Requirement 8)
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

  let passed = false;
  let hint = "";

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
  const totalMovement = dx.reduce((s, v) => s + Math.abs(v), 0) +
                        dy.reduce((s, v) => s + Math.abs(v), 0);

  let passed = false;
  let hint = "";

  switch (expectedSig) {
    case "D@": {  // circular
      // Detect direction reversals in both axes
      let xReversals = 0;
      let yReversals = 0;
      for (let i = 1; i < dx.length - 1; i++) {
        if (dx[i] * dx[i-1] < -0.0001) xReversals++;
        if (dy[i] * dy[i-1] < -0.0001) yReversals++;
      }
      passed = xReversals >= 1 && yReversals >= 1 && totalMovement > 0.03;
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
    case "Dz": {  // side to side
      let lateralReversals = 0;
      for (let i = 1; i < dx.length - 1; i++) {
        if (dx[i] * dx[i-1] < -0.0001) lateralReversals++;
      }
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
      let vertReversals = 0;
      for (let i = 1; i < dy.length - 1; i++) {
        if (dy[i] * dy[i-1] < -0.0001) vertReversals++;
      }
      passed = vertReversals >= 1 || totalMovement > 0.02;
      hint = "Nod your hand up and down.";
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
  dezPredictor: ((landmarks: Float32Array) => string) | null,
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
    const predictedDez = dezPredictor(normalized);
    dezPassed = predictedDez === notation.dez;
    dezConfidence = dezPassed ? 0.8 : 0.35;
  }

  // Sig check
  const sigResult = checkSig(frames, notation.sig);

  // Pass logic — generous thresholds ("impossible to fail if engaged")
  // Pass if at least 2 of 3 parameters are satisfied
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
