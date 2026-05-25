import { useEffect, useRef, useState } from "react";

export type WebcamState = "idle" | "requesting" | "active" | "denied" | "unavailable";

export function useWebcam(videoRef: React.RefObject<HTMLVideoElement | null>, enabled = true) {
  const [state, setState] = useState<WebcamState>("idle");
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!enabled) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      const resetId = window.setTimeout(() => setState("idle"), 0);
      return () => window.clearTimeout(resetId);
    }

    if (!videoRef.current) return;
    setState("requesting");

    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480, facingMode: "user" } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setState("active");
      })
      .catch((err) => {
        setState(err.name === "NotAllowedError" ? "denied" : "unavailable");
      });

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [enabled, videoRef]);

  return state;
}

// Capture a single frame from the video element into an ImageData.
export function captureFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  roi: { x: number; y: number; w: number; h: number },
): ImageData | null {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return null;

  const rx = Math.round(roi.x * vw);
  const ry = Math.round(roi.y * vh);
  const rw = Math.round(roi.w * vw);
  const rh = Math.round(roi.h * vh);

  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(video, rx, ry, rw, rh, 0, 0, 64, 64);
  return ctx.getImageData(0, 0, 64, 64);
}
