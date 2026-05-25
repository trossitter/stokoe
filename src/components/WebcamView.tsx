import { useEffect, useRef } from "react";
import { useWebcam } from "../hooks/useWebcam";
import { usePresenceTrigger } from "../hooks/usePresenceTrigger";

const ROI = { x: 0.12, y: 0.05, w: 0.76, h: 0.9 };

type Props = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  sessionState: "idle" | "recording" | "evaluating" | "result";
  onFramesReady: (frames: ImageData[]) => void;
  overlay?: React.ReactNode;
};

export function WebcamView({ videoRef, sessionState, onFramesReady, overlay }: Props) {
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  const camState = useWebcam(videoRef);
  const triggerEnabled = sessionState === "idle";

  const { state: triggerState, countdown, reset } = usePresenceTrigger(
    videoRef,
    ROI,
    onFramesReady,
    triggerEnabled,
  );

  // Reset presence trigger when session returns to idle after a result
  useEffect(() => {
    if (sessionState === "idle") reset();
  }, [sessionState, reset]);

  // Draw ROI overlay
  useEffect(() => {
    const draw = () => {
      const canvas = overlayRef.current;
      if (!canvas) { rafRef.current = requestAnimationFrame(draw); return; }

      const { offsetWidth: w, offsetHeight: h } = canvas.parentElement!;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, w, h);

      const rx = ROI.x * w;
      const ry = ROI.y * h;
      const rw = ROI.w * w;
      const rh = ROI.h * h;

      // Nearly-opaque outside ROI — students see only their hand, not their face/background
      ctx.fillStyle = "rgba(0,0,0,0.93)";
      ctx.fillRect(0, 0, w, ry);
      ctx.fillRect(0, ry + rh, w, h - ry - rh);
      ctx.fillRect(0, ry, rx, rh);
      ctx.fillRect(rx + rw, ry, w - rx - rw, rh);

      // ROI border — colour changes by state
      const borderColor = triggerState === "recording" ? "#ef4444"
                        : triggerState === "countdown"  ? "#f59e0b"
                        : triggerState === "detecting"  ? "#10b981"
                        : "#e2e8f0";
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = triggerState === "recording" ? 3 : 2;
      ctx.strokeRect(rx, ry, rw, rh);

      // Countdown fill — fills the bottom edge of the box
      if ((triggerState === "detecting" || triggerState === "countdown") && countdown > 0) {
        ctx.fillStyle = "rgba(16, 185, 129, 0.25)";
        ctx.fillRect(rx, ry + rh - 4, rw * countdown, 4);
      }

      // Corner markers
      const arm = 20;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      [
        [rx, ry, rx + arm, ry], [rx, ry, rx, ry + arm],
        [rx + rw, ry, rx + rw - arm, ry], [rx + rw, ry, rx + rw, ry + arm],
        [rx, ry + rh, rx + arm, ry + rh], [rx, ry + rh, rx, ry + rh - arm],
        [rx + rw, ry + rh, rx + rw - arm, ry + rh], [rx + rw, ry + rh, rx + rw, ry + rh - arm],
      ].forEach(([x1, y1, x2, y2]) => {
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      });

      // State label
      if (triggerState === "recording") {
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(rx + rw - 14, ry + 14, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 11px system-ui";
        ctx.fillText("REC", rx + rw - 50, ry + 19);
      }

      // Guide instruction
      if (triggerState === "idle" && camState === "active") {
        ctx.fillStyle = "rgba(255,255,255,0.65)";
        ctx.font = "12px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("Place your hand in the box to begin", rx + rw / 2, ry + rh + 16);
        ctx.textAlign = "left";
      } else if (triggerState === "detecting") {
        ctx.fillStyle = "rgba(16,185,129,0.8)";
        ctx.font = "12px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("Hold still…", rx + rw / 2, ry + rh + 16);
        ctx.textAlign = "left";
      } else if (triggerState === "recording") {
        ctx.fillStyle = "rgba(239,68,68,0.8)";
        ctx.font = "12px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("Sign now", rx + rw / 2, ry + rh + 16);
        ctx.textAlign = "left";
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [camState, triggerState, countdown]);

  // Shutter: iris to a circle during result review, open fully when active.
  // 60% keeps the bottom-edge CameraHint readable; open uses a generous value to show full rectangle.
  const shutterOpen = sessionState !== "result";
  const clipPath = shutterOpen ? "circle(200% at 50% 50%)" : "circle(60% at 50% 50%)";

  return (
    <section
      className="flex-1 bg-slate-900 rounded-2xl overflow-hidden relative min-h-0"
      style={{ clipPath, transition: "clip-path 0.45s cubic-bezier(0.4, 0, 0.2, 1)" }}
    >
      {camState === "denied" && (
        <div className="absolute inset-0 flex items-center justify-center text-center px-6">
          <div>
            <p className="text-white font-medium mb-1">Camera access denied</p>
            <p className="text-slate-400 text-sm">Allow camera access in your browser settings and reload.</p>
          </div>
        </div>
      )}
      {camState === "unavailable" && (
        <div className="absolute inset-0 flex items-center justify-center text-center px-6">
          <div>
            <p className="text-white font-medium mb-1">No camera detected</p>
            <p className="text-slate-400 text-sm">Connect a camera and reload.</p>
          </div>
        </div>
      )}
      {camState === "requesting" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-slate-400 text-sm">Requesting camera…</p>
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{ transform: "scaleX(-1)" }}
      />
      <canvas ref={overlayRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      {overlay}
    </section>
  );
}
