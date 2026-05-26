import { describe, expect, it } from "vitest";
import { NOTATION } from "../data/notation";
import type { NotationEntry } from "../data/notation";
import { verifyNotation } from "./notationVerifier";
import type { KeypointFrame } from "./notationVerifier";

type Landmark = NonNullable<KeypointFrame["landmarks"]>[number];

function landmarksAt(x: number, y: number, z = 0): Landmark[] {
  return Array.from({ length: 21 }, (_, i) => ({
    x: i === 0 ? x : x + i * 0.002,
    y: i === 0 ? y : y + i * 0.001,
    z,
  }));
}

function landmarksWithTipShift(x: number, y: number, tipShift: number): Landmark[] {
  const landmarks = landmarksAt(x, y);
  for (const index of [4, 8, 12, 16, 20]) {
    landmarks[index] = { ...landmarks[index], x: landmarks[index].x + tipShift };
  }
  return landmarks;
}

function landmarksWithFingerClose(indexMiddleSpread: number): Landmark[] {
  const landmarks = landmarksAt(0.5, 0.5);
  landmarks[4] = { x: 0.48, y: 0.49, z: 0 };
  landmarks[8] = { x: 0.48 + indexMiddleSpread, y: 0.49, z: 0 };
  landmarks[12] = { x: 0.48 + indexMiddleSpread, y: 0.51, z: 0 };
  return landmarks;
}

function framesFrom(points: Array<[number, number]>): KeypointFrame[] {
  return points.map(([x, y], i) => ({
    landmarks: landmarksAt(x, y),
    timestamp: i * 100,
  }));
}

function framesWithTipShifts(shifts: number[]): KeypointFrame[] {
  return shifts.map((shift, i) => ({
    landmarks: landmarksWithTipShift(0.5, 0.5, shift),
    timestamp: i * 100,
  }));
}

function framesWithFingerClose(spreads: number[]): KeypointFrame[] {
  return spreads.map((spread, i) => ({
    landmarks: landmarksWithFingerClose(spread),
    timestamp: i * 100,
  }));
}

function notation(tab: string, sig: string, dez = "B"): NotationEntry {
  return {
    ascii: `${tab}${dez}${sig}`,
    tab,
    dez,
    orientation: "f",
    sig,
    readable: "test notation",
  };
}

function dezPredictor(value: string) {
  return async () => value;
}

describe("verifyNotation tab checks", () => {
  const cases: Array<[string, [number, number]]> = [
    ["P", [0.5, 0.2]],
    ["U", [0.5, 0.55]],
    ["}", [0.2, 0.4]],
    ["[ ]", [0.5, 0.8]],
    ["0", [0.5, 0.5]],
  ];

  it.each(cases)("passes tab %s for matching wrist position", async (tab, point) => {
    const result = await verifyNotation(
      framesFrom([point, point, point]),
      notation(tab, "D"),
      dezPredictor("B"),
      null,
    );

    expect(result.passed).toBe(true);
    expect(result.failedParameter).toBeNull();
  });
});

describe("verifyNotation sig checks", () => {
  const cases: Array<[string, Array<[number, number]>]> = [
    ["D@", [[0.5, 0.5], [0.6, 0.55], [0.5, 0.6], [0.4, 0.55], [0.5, 0.5]]],
    ["Dx", [[0.5, 0.5], [0.52, 0.5], [0.5, 0.5]]],
    ["Df", [[0.45, 0.5], [0.51, 0.5], [0.57, 0.5]]],
    ["Dw", [[0.5, 0.5], [0.5, 0.56], [0.5, 0.5], [0.5, 0.56], [0.5, 0.5]]],
    ["D", [[0.5, 0.5], [0.505, 0.5], [0.5, 0.505]]],
  ];

  it.each(cases)("passes sig %s for matching movement", async (sig, points) => {
    const result = await verifyNotation(
      framesFrom(points),
      notation("0", sig),
      dezPredictor("B"),
      null,
    );

    expect(result.passed).toBe(true);
    expect(result.failedParameter).toBeNull();
  });

  it("passes De for fingertip wiggle without wrist travel", async () => {
    const result = await verifyNotation(
      framesWithTipShifts([0, 0.03, -0.03, 0.03, -0.03]),
      notation("0", "De"),
      dezPredictor("B"),
      null,
    );

    expect(result.passed).toBe(true);
    expect(result.failedParameter).toBeNull();
  });

  it("passes NO for finger-close movement without wrist travel", async () => {
    const result = await verifyNotation(
      framesWithFingerClose([0.14, 0.03, 0.13, 0.035, 0.12]),
      NOTATION.no,
      dezPredictor("H"),
      null,
    );

    expect(result.passed).toBe(true);
    expect(result.failedParameter).toBeNull();
  });

  it("passes when only D@ movement is approximate", async () => {
    const result = await verifyNotation(
      framesFrom([[0.4, 0.45], [0.6, 0.45], [0.4, 0.45], [0.6, 0.45], [0.6, 0.6], [0.6, 0.45]]),
      notation("0", "D@"),
      dezPredictor("B"),
      null,
    );

    expect(result.passed).toBe(true);
    expect(result.failedParameter).toBeNull();
  });

  it("passes when only Dr movement is approximate", async () => {
    const result = await verifyNotation(
      framesFrom([[0.5, 0.5], [0.5, 0.56], [0.5, 0.5]]),
      notation("0", "Dr"),
      dezPredictor("B"),
      null,
    );

    expect(result.passed).toBe(true);
    expect(result.failedParameter).toBeNull();
  });
});

describe("verifyNotation 2-of-3 pass/fail logic", () => {
  it("passes when tab, dez, and sig all pass", async () => {
    const result = await verifyNotation(
      framesFrom([[0.5, 0.5], [0.505, 0.5], [0.5, 0.505]]),
      notation("0", "D", "B"),
      dezPredictor("B"),
      null,
    );

    expect(result.passed).toBe(true);
    expect(result.failedParameter).toBeNull();
  });

  it("passes when exactly one parameter fails", async () => {
    const result = await verifyNotation(
      framesFrom([[0.5, 0.5], [0.505, 0.5], [0.5, 0.505]]),
      notation("0", "D", "B"),
      dezPredictor("A"),
      null,
    );

    expect(result.passed).toBe(true);
    expect(result.failedParameter).toBeNull();
  });

  it("fails when two parameters fail and reports the first failed parameter in tab, dez, sig order", async () => {
    const result = await verifyNotation(
      framesFrom([[0.5, 0.5], [0.505, 0.5], [0.5, 0.505]]),
      notation("P", "Df", "B"),
      dezPredictor("B"),
      null,
    );

    expect(result.passed).toBe(false);
    expect(result.failedParameter).toBe("tab");
  });
});

describe("verifyNotation sign-specific guardrails", () => {
  it("does not pass NO for a static H-hand in neutral space", async () => {
    const result = await verifyNotation(
      framesFrom([[0.5, 0.5], [0.5, 0.5], [0.5, 0.5]]),
      NOTATION.no,
      dezPredictor("H"),
      null,
    );

    expect(result.passed).toBe(false);
    expect(result.failedParameter).toBe("sig");
  });

  it("does not pass NO for finger-close movement with the wrong handshape", async () => {
    const result = await verifyNotation(
      framesWithFingerClose([0.14, 0.03, 0.13, 0.035, 0.12]),
      NOTATION.no,
      dezPredictor("B"),
      null,
    );

    expect(result.passed).toBe(false);
    expect(result.failedParameter).toBe("dez");
  });

  it("does not pass SEE for a static V-hand near the eyes", async () => {
    const result = await verifyNotation(
      framesFrom([[0.5, 0.32], [0.5, 0.32], [0.5, 0.32]]),
      NOTATION.see,
      dezPredictor("V"),
      null,
    );

    expect(result.passed).toBe(false);
    expect(result.failedParameter).toBe("sig");
  });

  it("does not pass SEE when the movement starts below the eyes", async () => {
    const result = await verifyNotation(
      framesFrom([[0.45, 0.65], [0.51, 0.65], [0.57, 0.65]]),
      NOTATION.see,
      dezPredictor("V"),
      null,
    );

    expect(result.passed).toBe(false);
    expect(result.failedParameter).toBe("tab");
  });

  it("passes SEE when location and movement are right even if handshape is noisy", async () => {
    const result = await verifyNotation(
      framesFrom([[0.45, 0.32], [0.51, 0.38], [0.57, 0.45]]),
      NOTATION.see,
      dezPredictor("B"),
      null,
    );

    expect(result.passed).toBe(true);
    expect(result.failedParameter).toBeNull();
  });
});

// ── Additional tab location cases ─────────────────────────────────────────────
// Without face landmarks: faceTop=0.1, faceBottom=0.7, faceMid=0.4
// "[ ]" (chest/trunk): passes when y > 0.7
// "U" (chin/lips):     passes when y > 0.4 && y < 0.75

describe("verifyNotation additional tab location cases", () => {
  // Chest signs: PLEASE, SORRY, HAPPY — tab = "[ ]"
  const chestSigns: Array<[string, string]> = [
    ["PLEASE", "[ ]"],
    ["SORRY",  "[ ]"],
    ["HAPPY",  "[ ]"],
  ];

  it.each(chestSigns)(
    "%s (tab=[ ]) passes when wrist is at chest level (y≈0.72)",
    async (_label, tab) => {
      const result = await verifyNotation(
        framesFrom([[0.5, 0.72], [0.5, 0.72], [0.5, 0.72]]),
        notation(tab, "D"),
        dezPredictor("B"),
        null,
      );
      expect(result.passed).toBe(true);
      expect(result.failedParameter).toBeNull();
    },
  );

  it.each(chestSigns)(
    "%s (tab=[ ]) still passes when only location is off",
    async (_label, tab) => {
      const result = await verifyNotation(
        framesFrom([[0.5, 0.2], [0.5, 0.2], [0.5, 0.2]]),
        notation(tab, "D"),
        dezPredictor("B"),
        null,
      );
      expect(result.passed).toBe(true);
      expect(result.failedParameter).toBeNull();
    },
  );

  // Chin/lips signs: THANK-YOU, GOOD, RED — tab = "U"
  const chinSigns: Array<[string, string]> = [
    ["THANK-YOU", "U"],
    ["GOOD",      "U"],
    ["RED",       "U"],
  ];

  it.each(chinSigns)(
    "%s (tab=U) passes when wrist is at chin level (y≈0.52)",
    async (_label, tab) => {
      const result = await verifyNotation(
        framesFrom([[0.5, 0.52], [0.5, 0.52], [0.5, 0.52]]),
        notation(tab, "D"),
        dezPredictor("B"),
        null,
      );
      expect(result.passed).toBe(true);
      expect(result.failedParameter).toBeNull();
    },
  );

  it.each(chinSigns)(
    "%s (tab=U) still passes when only location is off",
    async (_label, tab) => {
      const result = await verifyNotation(
        framesFrom([[0.5, 0.8], [0.5, 0.8], [0.5, 0.8]]),
        notation(tab, "D"),
        dezPredictor("B"),
        null,
      );
      expect(result.passed).toBe(true);
      expect(result.failedParameter).toBeNull();
    },
  );
});

// ── Additional sig movement cases ─────────────────────────────────────────────

describe("verifyNotation additional sig movement cases", () => {
  // Df — forward/outward arc
  it("passes Df for steady forward motion (increasing x across frames)", async () => {
    // net x displacement = 0.57 - 0.45 = 0.12 > 0.04
    const result = await verifyNotation(
      framesFrom([[0.45, 0.5], [0.51, 0.5], [0.57, 0.5]]),
      notation("0", "Df"),
      dezPredictor("B"),
      null,
    );
    expect(result.passed).toBe(true);
    expect(result.failedParameter).toBeNull();
  });

  it("passes Df when only movement is too small", async () => {
    // net x ≈ 0.001, totalMovement ≈ 0.001 — both under the 0.04 threshold
    const result = await verifyNotation(
      framesFrom([[0.5, 0.5], [0.5005, 0.5], [0.501, 0.5]]),
      notation("0", "Df"),
      dezPredictor("B"),
      null,
    );
    expect(result.passed).toBe(true);
    expect(result.failedParameter).toBeNull();
  });

  // Dr — repeated up-down (nod)
  it("passes Dr for two clear up-down reversals", async () => {
    // dy pattern: +0.06, -0.06, +0.06, -0.06 → 3 sign changes ≥ 2
    const result = await verifyNotation(
      framesFrom([
        [0.5, 0.5], [0.5, 0.56], [0.5, 0.5], [0.5, 0.56], [0.5, 0.5],
      ]),
      notation("0", "Dr"),
      dezPredictor("B"),
      null,
    );
    expect(result.passed).toBe(true);
    expect(result.failedParameter).toBeNull();
  });

  it("passes Dr when only movement has a single up-down reversal", async () => {
    // one reversal — mirrors the existing test to confirm it still holds
    const result = await verifyNotation(
      framesFrom([[0.5, 0.5], [0.5, 0.56], [0.5, 0.5]]),
      notation("0", "Dr"),
      dezPredictor("B"),
      null,
    );
    expect(result.passed).toBe(true);
    expect(result.failedParameter).toBeNull();
  });

  // D — static hold
  it("passes D for near-zero movement across frames", async () => {
    // totalMovement ≈ 0.004 — well below the 0.08 threshold
    const result = await verifyNotation(
      framesFrom([[0.5, 0.5], [0.502, 0.5], [0.5, 0.502]]),
      notation("0", "D"),
      dezPredictor("B"),
      null,
    );
    expect(result.passed).toBe(true);
    expect(result.failedParameter).toBeNull();
  });

  it("passes D when only the static hold moves too much", async () => {
    // totalMovement = 0.1 + 0.1 = 0.2 — well above the 0.08 threshold
    const result = await verifyNotation(
      framesFrom([[0.5, 0.5], [0.6, 0.5], [0.7, 0.5]]),
      notation("0", "D"),
      dezPredictor("B"),
      null,
    );
    expect(result.passed).toBe(true);
    expect(result.failedParameter).toBeNull();
  });
});

// ── Edge cases: empty and single-frame inputs ──────────────────────────────────

describe("verifyNotation edge cases", () => {
  it("returns passed=false without throwing when called with 0 frames", async () => {
    const result = await verifyNotation(
      [],
      notation("0", "D"),
      dezPredictor("B"),
      null,
    );
    expect(result.passed).toBe(false);
    // framing check fires first — validFrames < 2
    expect(result.failedParameter).toBe("framing");
  });

  it("returns passed=false without throwing when called with 1 frame", async () => {
    const result = await verifyNotation(
      [{ landmarks: landmarksAt(0.5, 0.5), timestamp: 0 }],
      notation("0", "D"),
      dezPredictor("B"),
      null,
    );
    expect(result.passed).toBe(false);
    expect(result.failedParameter).toBe("framing");
  });
});
