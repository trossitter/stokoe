import { useEffect, useRef } from "react";
import { useWebcam } from "../hooks/useWebcam";
import { usePresenceTrigger } from "../hooks/usePresenceTrigger";

const ROI = { x: 0.12, y: 0.05, w: 0.76, h: 0.9 };

type Props = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  sessionState: "idle" | "recording" | "evaluating" | "result";
  onFramesReady: (frames: ImageData[]) => void;
  onRecordingReady: (url: string) => void;
  overlay?: React.ReactNode;
};

export function WebcamView({ videoRef, sessionState, onFramesReady, onRecordingReady, overlay }: Props) {
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const onRecordingReadyRef = useRef(onRecordingReady);
  const liveVideoRef = useRef(videoRef);

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

  useEffect(() => {
    onRecordingReadyRef.current = onRecordingReady;
  }, [onRecordingReady]);

  useEffect(() => {
    liveVideoRef.current = videoRef;
  }, [videoRef]);

  useEffect(() => {
    if (triggerState === "recording") {
      if (recorderRef.current) return;

      const stream = liveVideoRef.current.current?.srcObject as MediaStream | null;
      if (!stream) return;

      const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        onRecordingReadyRef.current(url);
      };

      recorderRef.current = recorder;
      recorder.start();
      return;
    }

    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    recorderRef.current = null;
  }, [triggerState]);

  useEffect(() => {
    return () => {
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }
      recorderRef.current = null;
    };
  }, []);

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

      // Circular guide — centre of the ROI rect, radius = half the shorter side
      const cx = rx + rw / 2;
      const cy = ry + rh / 2;
      const cr = Math.min(rw, rh) * 0.48;

      const borderColor = triggerState === "recording" ? "#ef4444"
                        : triggerState === "countdown"  ? "#f59e0b"
                        : triggerState === "detecting"  ? "#10b981"
                        : "rgba(255,255,255,0.35)";

      ctx.strokeStyle = borderColor;
      ctx.lineWidth = triggerState === "recording" ? 3 : 2;
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.stroke();

      // Countdown arc — sweeps clockwise from top as presence holds
      if ((triggerState === "detecting" || triggerState === "countdown") && countdown > 0) {
        ctx.strokeStyle = "rgba(16, 185, 129, 0.7)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, cr, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * countdown);
        ctx.stroke();
      }

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

      // Guide instruction — centred inside/below the circle
      const labelY = cy + cr + 20;
      ctx.textAlign = "center";
      if (triggerState === "idle" && camState === "active") {
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.font = "12px system-ui";
        ctx.fillText("Place your hand in the circle to begin", cx, labelY);
      } else if (triggerState === "detecting") {
        ctx.fillStyle = "rgba(16,185,129,0.8)";
        ctx.font = "12px system-ui";
        ctx.fillText("Hold still…", cx, labelY);
      } else if (triggerState === "recording") {
        ctx.fillStyle = "rgba(239,68,68,0.8)";
        ctx.font = "12px system-ui";
        ctx.fillText("Sign now", cx, labelY);
      }
      ctx.textAlign = "left";

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [camState, triggerState, countdown]);

  // Iris: open circle when active, closes to smaller circle during result review
  const shutterOpen = sessionState !== "result";
  const clipPath = shutterOpen ? "circle(50% at 50% 50%)" : "circle(34% at 50% 50%)";

  return (
    <section
      className="flex-1 bg-slate-900 overflow-hidden relative min-h-0"
      style={{ clipPath, transition: "clip-path 0.45s cubic-bezier(0.4, 0, 0.2, 1)", borderRadius: "50%" }}
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
