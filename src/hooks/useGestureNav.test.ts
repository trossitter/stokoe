import { describe, expect, it } from "vitest";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { isThumbsUp, isOpenFive } from "./useGestureNav";

// Landmark indices used by both functions:
//   Thumb:  2=IP joint (wrist side), 4=tip
//   Index:  5=MCP, 6=PIP, 8=tip
//   Middle: 9=MCP, 10=PIP, 12=tip
//   Ring:   13=MCP, 14=PIP, 16=tip
//   Pinky:  17=MCP, 18=PIP, 20=tip
//
// Screen-space y: 0=top, 1=bottom  →  "above" = lower y value.
//
// isThumbsUp thresholds: thumbUpLift=0.08, fingerExtend (not used here)
//   thumbUp:       lm[4].y < lm[2].y - 0.08
//   fingerCurled:  tip.y   > pip.y
//
// isOpenFive thresholds: fingerExtend=0.06, thumbExtend=0.04
//   fingerOpen:  tip.y  < mcp.y - 0.06
//   thumbOpen:   lm[4].y < lm[2].y - 0.04

type LandmarkOverrides = Partial<Record<number, { x?: number; y: number; z?: number }>>;

function lm(overrides: LandmarkOverrides = {}): NormalizedLandmark[] {
  return Array.from({ length: 21 }, (_, i) => ({
    x: 0.5,
    y: 0.5 + i * 0.01, // default: each subsequent landmark slightly lower
    z: 0,
    visibility: 1,
    ...(overrides[i] !== undefined
      ? { x: 0.5, z: 0, visibility: 1, ...overrides[i] }
      : {}),
  }));
}

// ─── isThumbsUp ──────────────────────────────────────────────────────────────

describe("isThumbsUp", () => {
  // Base thumbs-up: thumb tip well above wrist landmark 2, all fingers curled.
  // lm[2].y = 0.5, lm[4].y must be < 0.5 - 0.08 = 0.42
  // Curled fingers: tip.y > pip.y  →  e.g. pip=0.3, tip=0.4
  const thumbsUpBase: LandmarkOverrides = {
    2: { y: 0.5 },   // thumb IP (wrist-side)
    4: { y: 0.40 },  // thumb tip — 0.10 above lm[2], well past 0.08 threshold
    // Index curled: pip=6 above tip=8 in screen coords  (tip.y > pip.y)
    6: { y: 0.30 },
    8: { y: 0.40 },
    // Middle curled
    10: { y: 0.30 },
    12: { y: 0.40 },
    // Ring curled
    14: { y: 0.30 },
    16: { y: 0.40 },
    // Pinky curled
    18: { y: 0.30 },
    20: { y: 0.40 },
  };

  it("passes when thumb tip is well above wrist and all fingers are curled", () => {
    expect(isThumbsUp(lm(thumbsUpBase))).toBe(true);
  });

  it("fails when thumb is up but index finger is extended (not curled)", () => {
    // Index tip above PIP: tip.y < pip.y
    const landmarks = lm({ ...thumbsUpBase, 8: { y: 0.20 } }); // tip above pip
    expect(isThumbsUp(landmarks)).toBe(false);
  });

  it("fails when thumb is not elevated (same y as wrist)", () => {
    // lm[4].y = lm[2].y — does not satisfy lm[4].y < lm[2].y - 0.08
    const landmarks = lm({ ...thumbsUpBase, 4: { y: 0.5 } });
    expect(isThumbsUp(landmarks)).toBe(false);
  });

  it("fails when all fingers are extended (open-5, not thumbs-up)", () => {
    // Fingers extended: tip.y < pip.y  (tips above PIPs)
    const landmarks = lm({
      2: { y: 0.5 },
      4: { y: 0.40 }, // thumb still up
      6: { y: 0.40 },
      8: { y: 0.20 }, // index tip above PIP → not curled
      10: { y: 0.40 },
      12: { y: 0.20 },
      14: { y: 0.40 },
      16: { y: 0.20 },
      18: { y: 0.40 },
      20: { y: 0.20 },
    });
    expect(isThumbsUp(landmarks)).toBe(false);
  });
});

// ─── isOpenFive ───────────────────────────────────────────────────────────────

describe("isOpenFive", () => {
  // Base open-5: all tips well above their MCPs, thumb extended.
  // fingerExtend=0.06: tip.y < mcp.y - 0.06
  // thumbExtend=0.04: lm[4].y < lm[2].y - 0.04
  //
  // Set MCPs at 0.5, tips at 0.40 (0.10 gap > 0.06 threshold)
  // Thumb: lm[2].y=0.5, lm[4].y=0.44 → 0.44 < 0.5-0.04=0.46  ✓
  const openFiveBase: LandmarkOverrides = {
    2: { y: 0.5 },   // thumb IP
    4: { y: 0.44 },  // thumb tip (0.06 above lm[2], past 0.04 threshold)
    5: { y: 0.5 },   // index MCP
    8: { y: 0.40 },  // index tip
    9: { y: 0.5 },   // middle MCP
    12: { y: 0.40 }, // middle tip
    13: { y: 0.5 },  // ring MCP
    16: { y: 0.40 }, // ring tip
    17: { y: 0.5 },  // pinky MCP
    20: { y: 0.40 }, // pinky tip
  };

  it("passes when all 5 finger tips are significantly above their MCPs", () => {
    expect(isOpenFive(lm(openFiveBase))).toBe(true);
  });

  it("fails when one finger is curled (tip below PIP)", () => {
    // Ring tip at same y as MCP — not above the threshold
    const landmarks = lm({ ...openFiveBase, 16: { y: 0.50 } });
    expect(isOpenFive(landmarks)).toBe(false);
  });

  it("fails when thumb is not extended", () => {
    // lm[4].y at same level as lm[2].y → does not clear thumbExtend=0.04
    const landmarks = lm({ ...openFiveBase, 4: { y: 0.5 } });
    expect(isOpenFive(landmarks)).toBe(false);
  });

  it("fails when hand is a fist (all tips at or below MCPs)", () => {
    const fist: LandmarkOverrides = {
      2: { y: 0.5 },
      4: { y: 0.5 },  // thumb not raised
      5: { y: 0.5 },
      8: { y: 0.5 },  // index tip at MCP level
      9: { y: 0.5 },
      12: { y: 0.5 },
      13: { y: 0.5 },
      16: { y: 0.5 },
      17: { y: 0.5 },
      20: { y: 0.5 },
    };
    expect(isOpenFive(lm(fist))).toBe(false);
  });
});

// ─── Boundary / threshold tests ───────────────────────────────────────────────

describe("isThumbsUp — boundary tests", () => {
  // Threshold: lm[4].y < lm[2].y - 0.08
  // With lm[2].y = 0.5, boundary is lm[4].y = 0.42
  // Just above threshold (0.42 - ε) → passes; exactly at boundary (0.42) → fails.

  const curledFingers: LandmarkOverrides = {
    6: { y: 0.30 },
    8: { y: 0.40 },
    10: { y: 0.30 },
    12: { y: 0.40 },
    14: { y: 0.30 },
    16: { y: 0.40 },
    18: { y: 0.30 },
    20: { y: 0.40 },
  };

  it("passes when thumb tip is just above the threshold (lm[4].y = boundary - 0.001)", () => {
    // boundary = 0.5 - 0.08 = 0.42 → just above = 0.419
    const landmarks = lm({ 2: { y: 0.5 }, 4: { y: 0.419 }, ...curledFingers });
    expect(isThumbsUp(landmarks)).toBe(true);
  });

  it("fails when thumb tip is exactly at the threshold (lm[4].y = lm[2].y - 0.08)", () => {
    // 0.42 < 0.42 is false
    const landmarks = lm({ 2: { y: 0.5 }, 4: { y: 0.42 }, ...curledFingers });
    expect(isThumbsUp(landmarks)).toBe(false);
  });
});
