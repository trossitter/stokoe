import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock notationVerifier so we control verifyNotation outcomes
vi.mock("./notationVerifier", () => ({
  verifyNotation: vi.fn(),
}));

const { mockLandmarks } = vi.hoisted(() => ({
  mockLandmarks: Array.from({ length: 21 }, (_, i) => ({
    x: i * 0.002,
    y: i * 0.001,
    z: 0,
  })),
}));

// Mock handLandmarker so detection returns a minimal hand without WebGL/Wasm
vi.mock("./handLandmarker", () => ({
  detectHandFrame: vi.fn().mockResolvedValue({ landmarks: mockLandmarks, handCount: 1 }),
  detectLandmarks: vi.fn().mockResolvedValue(mockLandmarks),
}));

// Mock dezPredictor so no ONNX model is loaded
vi.mock("./dezPredictor", () => ({
  getDezPredictor: vi.fn().mockResolvedValue(async () => "B"),
}));

import { verifyNotation } from "./notationVerifier";
import { detectHandFrame } from "./handLandmarker";
import { classifyAttempt } from "./signClassifier";
import { NOTATION } from "../data/notation";
import { VOCAB } from "../data/vocab";

const mockVerify = vi.mocked(verifyNotation);
const mockDetectHandFrame = vi.mocked(detectHandFrame);

// Minimal ImageData stand-in — classifyAttempt passes frames to detectHandFrame
// which is fully mocked, so the actual content doesn't matter
function makeFrames(count: number): ImageData[] {
  return Array.from({ length: count }, () => ({} as ImageData));
}

beforeEach(() => {
  mockVerify.mockReset();
  mockDetectHandFrame.mockResolvedValue({ landmarks: mockLandmarks, handCount: 1 });
});

describe("classifyAttempt — sign exists in NOTATION map", () => {
  it("has notation for every vocab item", () => {
    const missing = VOCAB
      .filter(({ id }) => !NOTATION[id])
      .map(({ id }) => id);

    expect(missing).toEqual([]);
  });

  it("returns passed=true and hintKey=null when verifyNotation resolves passed", async () => {
    mockVerify.mockResolvedValue({ passed: true, failedParameter: null, confidence: 0.9 });

    const result = await classifyAttempt(makeFrames(3), "hello");

    expect(result.passed).toBe(true);
    expect(result.hintKey).toBeNull();
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it("routes BATHROOM through notation verification", async () => {
    mockVerify.mockResolvedValue({ passed: true, failedParameter: null, confidence: 0.8 });

    await classifyAttempt(makeFrames(3), "bathroom");

    expect(mockVerify).toHaveBeenCalled();
  });

  it("returns passed=false and hintKey='movement' when sig fails", async () => {
    mockVerify.mockResolvedValue({ passed: false, failedParameter: "sig", confidence: 0.4 });

    const result = await classifyAttempt(makeFrames(3), "hello");

    expect(result.passed).toBe(false);
    expect(result.hintKey).toBe("movement");
  });

  it("returns hintKey='location' when tab fails", async () => {
    mockVerify.mockResolvedValue({ passed: false, failedParameter: "tab", confidence: 0.3 });

    const result = await classifyAttempt(makeFrames(3), "please");

    expect(result.passed).toBe(false);
    expect(result.hintKey).toBe("location");
  });

  it("returns hintKey='handshape' when dez fails", async () => {
    mockVerify.mockResolvedValue({ passed: false, failedParameter: "dez", confidence: 0.3 });

    const result = await classifyAttempt(makeFrames(3), "please");

    expect(result.passed).toBe(false);
    expect(result.hintKey).toBe("handshape");
  });

  it("returns hintKey='framing' when framing fails", async () => {
    mockVerify.mockResolvedValue({ passed: false, failedParameter: "framing", confidence: 0.0 });

    const result = await classifyAttempt(makeFrames(3), "hello");

    expect(result.passed).toBe(false);
    expect(result.hintKey).toBe("framing");
  });

  it("returns hintKey='framing' when a two-handed sign has only one visible hand", async () => {
    mockVerify.mockResolvedValue({ passed: false, failedParameter: "hands", confidence: 0.2 });

    const result = await classifyAttempt(makeFrames(3), "want");

    expect(result.passed).toBe(false);
    expect(result.hintKey).toBe("framing");
  });

  it("passes detected hand counts to notation verification", async () => {
    mockDetectHandFrame.mockResolvedValue({ landmarks: mockLandmarks, handCount: 2 });
    mockVerify.mockResolvedValue({ passed: true, failedParameter: null, confidence: 0.9 });

    await classifyAttempt(makeFrames(2), "want");

    const keypointFrames = mockVerify.mock.calls[0][0];
    expect(keypointFrames).toHaveLength(2);
    expect(keypointFrames.every((frame) => frame.handCount === 2)).toBe(true);
  });
});

describe("classifyAttempt — unknown sign ID", () => {
  it("does not throw and returns passed=false for an unknown sign ID", async () => {
    // verifyNotation is never called — the classifier short-circuits when
    // the sign is absent from NOTATION
    const result = await classifyAttempt(makeFrames(3), "zzz-nonexistent");

    expect(result.passed).toBe(false);
    expect(mockVerify).not.toHaveBeenCalled();
  });
});

describe("classifyAttempt — edge cases", () => {
  it("does not throw when called with 0 frames", async () => {
    mockVerify.mockResolvedValue({ passed: false, failedParameter: "framing", confidence: 0.0 });

    await expect(classifyAttempt(makeFrames(0), "hello")).resolves.not.toThrow();

    const result = await classifyAttempt(makeFrames(0), "hello");
    expect(result.passed).toBe(false);
  });
});
