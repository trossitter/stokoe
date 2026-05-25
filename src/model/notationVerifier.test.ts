import { describe, expect, it } from "vitest";
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

  it("fails D@ when x and y reversals are grouped instead of interleaved", async () => {
    const result = await verifyNotation(
      framesFrom([[0.4, 0.45], [0.6, 0.45], [0.4, 0.45], [0.6, 0.45], [0.6, 0.6], [0.6, 0.45]]),
      notation("0", "D@"),
      dezPredictor("B"),
      null,
    );

    expect(result.passed).toBe(false);
    expect(result.failedParameter).toBe("sig");
  });

  it("fails Dr for a single vertical reversal", async () => {
    const result = await verifyNotation(
      framesFrom([[0.5, 0.5], [0.5, 0.56], [0.5, 0.5]]),
      notation("0", "Dr"),
      dezPredictor("B"),
      null,
    );

    expect(result.passed).toBe(false);
    expect(result.failedParameter).toBe("sig");
  });
});

describe("verifyNotation 3-of-3 pass/fail logic", () => {
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

  it("fails when exactly one parameter fails", async () => {
    const result = await verifyNotation(
      framesFrom([[0.5, 0.5], [0.505, 0.5], [0.5, 0.505]]),
      notation("0", "D", "B"),
      dezPredictor("A"),
      null,
    );

    expect(result.passed).toBe(false);
    expect(result.failedParameter).toBe("dez");
  });

  it("reports the first failed parameter in tab, dez, sig order", async () => {
    const result = await verifyNotation(
      framesFrom([[0.5, 0.5], [0.505, 0.5], [0.5, 0.505]]),
      notation("P", "Df", "B"),
      dezPredictor("A"),
      null,
    );

    expect(result.passed).toBe(false);
    expect(result.failedParameter).toBe("tab");
  });
});
