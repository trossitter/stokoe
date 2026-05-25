import { useEffect, useRef, useState } from "react";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { getHandLandmarker } from "../model/handLandmarker";

const THRESHOLDS = {
  thumbUpLift: 0.08,
  fingerExtend: 0.06,
  thumbExtend: 0.04,
  dwellMs: 900,
  lockoutMs: 1500,
};

type Gesture = "next" | "retry";
type GestureState = { gesture: Gesture | null; dwellProgress: number };

const IDLE_GESTURE: GestureState = { gesture: null, dwellProgress: 0 };

function isThumbsUp(lm: NormalizedLandmark[]): boolean {
  const thumbUp = lm[4].y < lm[2].y - THRESHOLDS.thumbUpLift;
  const indexCurled = lm[8].y > lm[6].y;
  const middleCurled = lm[12].y > lm[10].y;
  const ringCurled = lm[16].y > lm[14].y;
  const pinkyCurled = lm[20].y > lm[18].y;
  return thumbUp && indexCurled && middleCurled && ringCurled && pinkyCurled;
}

function isOpenFive(lm: NormalizedLandmark[]): boolean {
  const indexOpen = lm[8].y < lm[5].y - THRESHOLDS.fingerExtend;
  const middleOpen = lm[12].y < lm[9].y - THRESHOLDS.fingerExtend;
  const ringOpen = lm[16].y < lm[13].y - THRESHOLDS.fingerExtend;
  const pinkyOpen = lm[20].y < lm[17].y - THRESHOLDS.fingerExtend;
  const thumbOpen = lm[4].y < lm[2].y - THRESHOLDS.thumbExtend;
  return indexOpen && middleOpen && ringOpen && pinkyOpen && thumbOpen;
}

export function useGestureNav(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean,
  onNext: () => void,
  onRetry: () => void,
): GestureState {
  const [gestureState, setGestureState] = useState<GestureState>(IDLE_GESTURE);
  const dwellStartRef = useRef<number | null>(null);
  const currentGestureRef = useRef<Gesture | null>(null);
  const lockedUntilRef = useRef(0);
  const onNextRef = useRef(onNext);
  const onRetryRef = useRef(onRetry);

  useEffect(() => {
    onNextRef.current = onNext;
  }, [onNext]);

  useEffect(() => {
    onRetryRef.current = onRetry;
  }, [onRetry]);

  useEffect(() => {
    if (!enabled) {
      dwellStartRef.current = null;
      currentGestureRef.current = null;
      lockedUntilRef.current = 0;
      return;
    }

    let alive = true;
    const canvas = document.createElement("canvas");

    const resetDwell = (gesture: Gesture | null, now: number) => {
      currentGestureRef.current = gesture;
      dwellStartRef.current = gesture ? now : null;
      setGestureState(gesture ? { gesture, dwellProgress: 0 } : IDLE_GESTURE);
    };

    const tick = async (now: number) => {
      if (!alive) return;

      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        requestAnimationFrame(tick);
        return;
      }

      if (now < lockedUntilRef.current) {
        requestAnimationFrame(tick);
        return;
      }

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
        const landmarks = result.landmarks?.[0];
        let candidate: Gesture | null = null;

        if (landmarks?.length >= 21) {
          if (isThumbsUp(landmarks)) candidate = "next";
          else if (isOpenFive(landmarks)) candidate = "retry";
        }

        if (candidate !== currentGestureRef.current) {
          resetDwell(candidate, now);
        } else if (candidate) {
          const dwellStart = dwellStartRef.current ?? now;
          const elapsed = now - dwellStart;
          const dwellProgress = Math.min(1, elapsed / THRESHOLDS.dwellMs);

          if (elapsed >= THRESHOLDS.dwellMs) {
            if (candidate === "next") onNextRef.current();
            else onRetryRef.current();

            lockedUntilRef.current = now + THRESHOLDS.lockoutMs;
            resetDwell(null, now);
          } else {
            setGestureState({ gesture: candidate, dwellProgress });
          }
        }
      } catch {
        // HandLandmarker can still be warming up; keep the RAF loop alive.
      }

      if (alive) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
    return () => {
      alive = false;
      dwellStartRef.current = null;
      currentGestureRef.current = null;
    };
  }, [enabled, videoRef]);

  return enabled ? gestureState : IDLE_GESTURE;
}
