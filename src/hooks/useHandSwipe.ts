import { useEffect, useRef } from "react";
import { getHandLandmarker } from "../model/handLandmarker";

const DISPLACE_THRESHOLD = 0.28;   // raised from 0.22 — requires a deliberate swipe
const TRACK_WINDOW_MS = 400;        // tightened from 650ms — snappier response
const MIN_SAMPLES = 5;
const FLICK_VELOCITY = 0.0012;
const FLICK_DISPLACE_FLOOR = 0.08;
const FLICK_LOOKBACK = 3;
const SAMPLE_MS = 90;
const DIRECTION_PURITY = 2;         // |x-delta| must be >= 2× |y-delta| — filters diagonal waves

const HOLD_FIRE_MS = 500;
const HOLD_X_THRESHOLD = 0.58;

type Opts = {
  displaceThreshold?: number;
  noFlick?: boolean;
  alsoFireOnPosition?: boolean;
};

// Detects rightward and leftward hand swipes from the live camera feed.
// Fires once per continuous hand presence — resets when the hand leaves the frame.
export function useHandSwipe(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean,
  onSwipeRight: () => void,
  onSwipeLeft?: () => void,
  opts?: Opts,
): void {
  const rightRef = useRef(onSwipeRight);
  const leftRef = useRef(onSwipeLeft);
  useEffect(() => { rightRef.current = onSwipeRight; }, [onSwipeRight]);
  useEffect(() => { leftRef.current = onSwipeLeft; }, [onSwipeLeft]);

  const displaceThreshold = opts?.displaceThreshold ?? DISPLACE_THRESHOLD;
  const noFlick = opts?.noFlick ?? false;
  const alsoFireOnPosition = opts?.alsoFireOnPosition ?? false;

  useEffect(() => {
    if (!enabled) return;

    let alive = true;
    const samples: Array<{ x: number; y: number; ts: number }> = [];
    let lastSample = 0;
    let fired = false;
    let rightSideSince: number | null = null;
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
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(video, -256, 0, 256, 256);
          ctx.restore();

          const result = landmarker.detect(canvas);
          if (result.landmarks?.length) {
            const wx = result.landmarks[0][0].x;
            const wy = result.landmarks[0][0].y;
            samples.push({ x: wx, y: wy, ts: now });
            const cutoff = now - TRACK_WINDOW_MS;
            while (samples.length && samples[0].ts < cutoff) samples.shift();

            if (!fired) {
              // Displacement trigger — left or right
              if (samples.length >= MIN_SAMPLES) {
                const dx = samples[samples.length - 1].x - samples[0].x;
                const dy = Math.abs(samples[samples.length - 1].y - samples[0].y);
                const pure = dy === 0 || Math.abs(dx) >= DIRECTION_PURITY * dy;

                if (pure && dx > displaceThreshold) {
                  fired = true;
                  rightRef.current();
                } else if (pure && dx < -displaceThreshold && leftRef.current) {
                  fired = true;
                  leftRef.current();
                }
              }

              // Velocity / flick trigger (right only, disabled when noFlick)
              if (!fired && !noFlick && samples.length >= FLICK_LOOKBACK) {
                const tail = samples.slice(-FLICK_LOOKBACK);
                const dt = tail[tail.length - 1].ts - tail[0].ts;
                if (dt > 0) {
                  const dx = tail[tail.length - 1].x - tail[0].x;
                  const dy = Math.abs(tail[tail.length - 1].y - tail[0].y);
                  const pure = dy === 0 || Math.abs(dx) >= DIRECTION_PURITY * dy;
                  const monotonic = tail.every((_, i) => i === 0 || tail[i].x >= tail[i - 1].x);
                  if (pure && dx > 0 && monotonic && dx >= FLICK_DISPLACE_FLOOR && dx / dt >= FLICK_VELOCITY) {
                    fired = true;
                    rightRef.current();
                  }
                }
              }

              // Position-hold trigger (opt-in) — pointing or resting on right side
              if (!fired && alsoFireOnPosition) {
                if (wx >= HOLD_X_THRESHOLD) {
                  if (rightSideSince === null) rightSideSince = now;
                  else if (now - rightSideSince >= HOLD_FIRE_MS) {
                    fired = true;
                    rightRef.current();
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
  }, [alsoFireOnPosition, displaceThreshold, enabled, noFlick, videoRef]);
}
