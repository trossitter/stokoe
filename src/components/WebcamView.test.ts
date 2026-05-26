import { afterEach, describe, expect, it, vi } from "vitest";
import { getRecordingMimeType } from "./recordingSupport";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getRecordingMimeType", () => {
  it("returns null when MediaRecorder is not available", () => {
    vi.stubGlobal("MediaRecorder", undefined);

    expect(getRecordingMimeType()).toBeNull();
  });

  it("picks the first supported browser recorder format", () => {
    class FakeMediaRecorder {
      static isTypeSupported(type: string) {
        return type === "video/webm;codecs=vp8";
      }
    }

    vi.stubGlobal("MediaRecorder", FakeMediaRecorder);

    expect(getRecordingMimeType()).toBe("video/webm;codecs=vp8");
  });

  it("falls back to browser defaults when no listed format is reported", () => {
    class FakeMediaRecorder {
      static isTypeSupported() {
        return false;
      }
    }

    vi.stubGlobal("MediaRecorder", FakeMediaRecorder);

    expect(getRecordingMimeType()).toBe("");
  });
});
