import { useEffect, useRef } from "react";
import { getHandLandmarker } from "../model/handLandmarker";

const DISPLACE_THRESHOLD = 0.22;
const TRACK_WINDOW_MS = 650;
const MIN_SAMPLES = 5;
const FLICK_VELOCITY = 0.0012;
const FLICK_DISPLACE_FLOOR = 0.08;
const FLICK_LOOKBACK = 3;
const SAMPLE_MS = 90;

// Detects a rightward hand swipe from the live camera feed.
// Fires onSwipeRight once per continuous hand presence — resets when
// the hand leaves the frame, so a second swipe is possible after re-entry.
export function useHandSwipe(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean,
  onSwipeRight: () => void,
): void {
  const callbackRef = useRef(onSwipeRight);
  useEffect(() => { callbackRef.current = onSwipeRight; }, [onSwipeRight]);

  useEffect(() => {
    if (!enabled) return;

    let alive = true;
    const samples: Array<{ x: number; ts: number }> = [];
    let lastSample = 0;
    let fired = false;
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
                if (delta > DISPLACE_THRESHOLD) {
                  fired = true;
                  callbackRef.current();
                }
              }
              // Velocity / flick trigger
              if (!fired && samples.length >= FLICK_LOOKBACK) {
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
            }
          } else {
            // Hand left frame — allow a fresh swipe on re-entry
            samples.length = 0;
            fired = false;
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
