import { useEffect, useRef } from "react";
import { getHandLandmarker } from "../model/handLandmarker";

const DISPLACE_THRESHOLD = 0.22;
const TRACK_WINDOW_MS = 650;
const MIN_SAMPLES = 5;
const FLICK_VELOCITY = 0.0012;
const FLICK_DISPLACE_FLOOR = 0.08;
const FLICK_LOOKBACK = 3;
const SAMPLE_MS = 90;

// How long (ms) a hand must sit on the right side to trigger a position-hold fire
const HOLD_FIRE_MS = 500;
const HOLD_X_THRESHOLD = 0.58; // right portion of frame

type Opts = {
  // Override displacement threshold (default DISPLACE_THRESHOLD).
  displaceThreshold?: number;
  // Disable the velocity/flick trigger (slower, more deliberate gestures only).
  noFlick?: boolean;
  // Also fire if the hand stays on the right side of the frame for HOLD_FIRE_MS.
  alsoFireOnPosition?: boolean;
};

// Detects a rightward hand swipe from the live camera feed.
// Fires onSwipeRight once per continuous hand presence — resets when
// the hand leaves the frame, so a second swipe is possible after re-entry.
export function useHandSwipe(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean,
  onSwipeRight: () => void,
  opts?: Opts,
): void {
  const callbackRef = useRef(onSwipeRight);
  useEffect(() => { callbackRef.current = onSwipeRight; }, [onSwipeRight]);

  useEffect(() => {
    if (!enabled) return;

    const displaceThreshold = opts?.displaceThreshold ?? DISPLACE_THRESHOLD;
    const noFlick = opts?.noFlick ?? false;
    const alsoFireOnPosition = opts?.alsoFireOnPosition ?? false;
    let alive = true;
    const samples: Array<{ x: number; ts: number }> = [];
    let lastSample = 0;
    let fired = false;
    let rightSideSince: number | null = null; // for position-hold detection
    const canvas = document.createElement("canvas");

    const tick = async (now: number) => {
      if (!alive) return;

      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        requestAnimationFrame(tick);
        return;
      }

      if (now - lastSample >= SAMPLE_MS) {
        lastSample = now;
        try {
          const landmarker = await getHandLandmarker();
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext("2d")!;
          // Mirror to match display orientation
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(video, -256, 0, 256, 256);
          ctx.restore();

          const result = landmarker.detect(canvas);
          if (result.landmarks?.length) {
            const wx = result.landmarks[0][0].x;
            samples.push({ x: wx, ts: now });
            const cutoff = now - TRACK_WINDOW_MS;
            while (samples.length && samples[0].ts < cutoff) samples.shift();

            if (!fired) {
              // Displacement trigger
              if (samples.length >= MIN_SAMPLES) {
                const delta = samples[samples.length - 1].x - samples[0].x;
                if (delta > displaceThreshold) {
                  fired = true;
                  callbackRef.current();
                }
              }
              // Velocity / flick trigger (disabled when noFlick)
              if (!fired && !noFlick && samples.length >= FLICK_LOOKBACK) {
                const tail = samples.slice(-FLICK_LOOKBACK);
                const dt = tail[tail.length - 1].ts - tail[0].ts;
                if (dt > 0) {
                  const dx = tail[tail.length - 1].x - tail[0].x;
                  const monotonic = tail.every((_, i) => i === 0 || tail[i].x >= tail[i - 1].x);
                  if (dx > 0 && monotonic && dx >= FLICK_DISPLACE_FLOOR && dx / dt >= FLICK_VELOCITY) {
                    fired = true;
                    callbackRef.current();
                  }
                }
              }
              // Position-hold trigger (opt-in) — pointing or resting on right side
              if (!fired && alsoFireOnPosition) {
                if (wx >= HOLD_X_THRESHOLD) {
                  if (rightSideSince === null) rightSideSince = now;
                  else if (now - rightSideSince >= HOLD_FIRE_MS) {
                    fired = true;
                    callbackRef.current();
                  }
                } else {
                  rightSideSince = null;
                }
              }
            }
          } else {
            // Hand left frame — allow a fresh swipe on re-entry
            samples.length = 0;
            fired = false;
            rightSideSince = null;
          }
        } catch {
          // landmarker still loading
        }
      }

      if (alive) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
    return () => { alive = false; };
  }, [enabled, videoRef]);
}
