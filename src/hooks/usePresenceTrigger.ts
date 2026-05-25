/**
 * usePresenceTrigger — hands-free recording trigger.
 *
 * Watches a canvas element for hand presence using a lightweight
 * pixel-activity check on the ROI (no MediaPipe dependency here —
 * MediaPipe hands detection happens in the full pipeline; this is
 * a fast pre-screen to know when hands are in frame).
 *
 * State machine:
 *   idle → detecting (hands seen) → countdown (1s hold) → recording (2s) → done
 */

import { useCallback, useEffect, useRef, useState } from "react";

export type TriggerState = "idle" | "detecting" | "countdown" | "recording" | "done";

const DETECT_HOLD_MS = 900;   // hands must be present this long before recording
const RECORD_DURATION_MS = 2200;

export function usePresenceTrigger(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  roi: { x: number; y: number; w: number; h: number },
  onRecordingComplete: (frames: ImageData[]) => void,
  enabled: boolean,
) {
  const [state, setState] = useState<TriggerState>("idle");
  const [countdown, setCountdown] = useState(0); // 0-1 progress for countdown animation

  const scanCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const framesRef = useRef<ImageData[]>([]);
  const detectStartRef = useRef<number | null>(null);
  const recordStartRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);
  const captureIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef<TriggerState>("idle");

  // Keep ref in sync with state
  useEffect(() => { stateRef.current = state; }, [state]);

  const reset = useCallback(() => {
    setState("idle");
    stateRef.current = "idle";
    detectStartRef.current = null;
    recordStartRef.current = null;
    framesRef.current = [];
    setCountdown(0);
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
  }, []);

  // Detect hand presence via motion/activity in ROI
  const detectHandPresence = useCallback((video: HTMLVideoElement): boolean => {
    if (!scanCanvasRef.current) {
      scanCanvasRef.current = document.createElement("canvas");
    }
    const canvas = scanCanvasRef.current;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return false;

    const rx = Math.round(roi.x * vw);
    const ry = Math.round(roi.y * vh);
    const rw = Math.round(roi.w * vw);
    const rh = Math.round(roi.h * vh);

    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(video, rx, ry, rw, rh, 0, 0, 32, 32);
    const { data } = ctx.getImageData(0, 0, 32, 32);

    // Count pixels with skin-like values (rough HSV check)
    let skinPixels = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const s = max === 0 ? 0 : (max - min) / max;
      // Loose skin tone range: warm, moderate saturation, not too dark or bright
      if (r > 60 && r > g && r > b && s > 0.1 && s < 0.9 && max < 240 && max > 50) {
        skinPixels++;
      }
    }
    // Require at least 5% of ROI pixels to be skin-like
    return skinPixels > (1024 * 0.05);
  }, [roi]);

  const captureFrame = useCallback((video: HTMLVideoElement): ImageData | null => {
    if (!captureCanvasRef.current) {
      captureCanvasRef.current = document.createElement("canvas");
    }
    const canvas = captureCanvasRef.current;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return null;

    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(
      video,
      Math.round(roi.x * vw), Math.round(roi.y * vh),
      Math.round(roi.w * vw), Math.round(roi.h * vh),
      0, 0, 64, 64
    );
    return ctx.getImageData(0, 0, 64, 64);
  }, [roi]);

  useEffect(() => {
    if (!enabled) {
      const resetId = window.setTimeout(reset, 0);
      return () => window.clearTimeout(resetId);
    }

    const tick = (now: number) => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const current = stateRef.current;

      if (current === "idle" || current === "detecting") {
        const handsPresent = detectHandPresence(video);

        if (handsPresent) {
          if (detectStartRef.current === null) {
            detectStartRef.current = now;
            setState("detecting");
          } else {
            const held = now - detectStartRef.current;
            setCountdown(Math.min(held / DETECT_HOLD_MS, 1));
            if (held >= DETECT_HOLD_MS) {
              // Begin recording
              setState("recording");
              stateRef.current = "recording";
              recordStartRef.current = now;
              framesRef.current = [];
              captureIntervalRef.current = setInterval(() => {
                const frame = captureFrame(video);
                if (frame) framesRef.current.push(frame);
              }, 100);
            }
          }
        } else {
          // Hands left — reset detect timer but stay in loop
          detectStartRef.current = null;
          if (current === "detecting") {
            setState("idle");
            setCountdown(0);
          }
        }
      }

      if (current === "recording") {
        const elapsed = now - (recordStartRef.current ?? now);
        if (elapsed >= RECORD_DURATION_MS) {
          if (captureIntervalRef.current) {
            clearInterval(captureIntervalRef.current);
            captureIntervalRef.current = null;
          }
          setState("done");
          stateRef.current = "done";
          onRecordingComplete(framesRef.current);
          return; // stop RAF
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
    };
  }, [enabled, videoRef, detectHandPresence, captureFrame, onRecordingComplete, reset]);

  return { state, countdown, reset };
}
