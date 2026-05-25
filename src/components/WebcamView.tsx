import { useEffect, useRef, useState } from "react";
import { captureFrame, useWebcam } from "../hooks/useWebcam";

const ROI = { x: 0.12, y: 0.05, w: 0.76, h: 0.9 };
const COUNTDOWN_MS = 1000;
const RECORD_DURATION_MS = 2200;
const FRAME_INTERVAL_MS = 100;

type Props = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  sessionState: "idle" | "recording" | "evaluating" | "result";
  paused?: boolean;
  cameraEnabled?: boolean;
  recordRequestId?: number;
  onFramesReady: (frames: ImageData[]) => void;
  onRecordingReady: (url: string) => void;
  overlay?: React.ReactNode;
};

type RecordingCueState = "idle" | "countdown" | "recording";

export function WebcamView({
  videoRef,
  sessionState,
  paused = false,
  cameraEnabled = true,
  recordRequestId = 0,
  onFramesReady,
  onRecordingReady,
  overlay,
}: Props) {
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const onRecordingReadyRef = useRef(onRecordingReady);
  const onFramesReadyRef = useRef(onFramesReady);
  const liveVideoRef = useRef(videoRef);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [recordingCueState, setRecordingCueState] = useState<RecordingCueState>("idle");
  const [countdown, setCountdown] = useState(0);

  const camState = useWebcam(videoRef, cameraEnabled);

  useEffect(() => {
    onRecordingReadyRef.current = onRecordingReady;
  }, [onRecordingReady]);

  useEffect(() => {
    onFramesReadyRef.current = onFramesReady;
  }, [onFramesReady]);

  useEffect(() => {
    liveVideoRef.current = videoRef;
  }, [videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (paused) {
      video.pause();
    } else if (camState === "active") {
      video.play().catch(() => {});
    }
  }, [camState, paused, videoRef]);

  useEffect(() => {
    if (!recordRequestId || paused || !cameraEnabled || sessionState !== "recording") return;

    let alive = true;
    let cueRaf = 0;
    let waitRaf = 0;
    let recordTimer = 0;
    let frameInterval: ReturnType<typeof setInterval> | null = null;
    let recorder: MediaRecorder | null = null;
    const frames: ImageData[] = [];
    const chunks: BlobPart[] = [];

    const stopRecorder = () => {
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }
    };

    const finishEmpty = () => {
      if (!alive) return;
      setRecordingCueState("idle");
      setCountdown(0);
      onFramesReadyRef.current([]);
    };

    const finishRecording = () => {
      if (!alive) return;
      if (frameInterval) {
        clearInterval(frameInterval);
        frameInterval = null;
      }
      stopRecorder();
      setRecordingCueState("idle");
      setCountdown(0);
      onFramesReadyRef.current(frames);
    };

    const beginRecording = (video: HTMLVideoElement) => {
      setRecordingCueState("recording");
      setCountdown(1);

      const stream = video.srcObject as MediaStream | null;
      if (stream) {
        const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : "video/webm";
        recorder = new MediaRecorder(stream, { mimeType });
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          onRecordingReadyRef.current(url);
        };
        recorder.start();
      }

      const grabFrame = () => {
        if (!captureCanvasRef.current) {
          captureCanvasRef.current = document.createElement("canvas");
        }
        const frame = captureFrame(video, captureCanvasRef.current, ROI);
        if (frame) frames.push(frame);
      };

      grabFrame();
      frameInterval = setInterval(grabFrame, FRAME_INTERVAL_MS);
      recordTimer = window.setTimeout(finishRecording, RECORD_DURATION_MS);
    };

    const beginCountdown = (video: HTMLVideoElement) => {
      setRecordingCueState("countdown");
      const startedAt = performance.now();

      const tick = (now: number) => {
        if (!alive) return;
        const progress = Math.min(1, (now - startedAt) / COUNTDOWN_MS);
        setCountdown(progress);
        if (progress >= 1) {
          beginRecording(video);
          return;
        }
        cueRaf = requestAnimationFrame(tick);
      };

      cueRaf = requestAnimationFrame(tick);
    };

    const waitForVideo = (startedAt: number) => {
      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        beginCountdown(video);
        return;
      }
      if (performance.now() - startedAt > 3000) {
        finishEmpty();
        return;
      }
      waitRaf = requestAnimationFrame(() => waitForVideo(startedAt));
    };

    waitForVideo(performance.now());

    return () => {
      alive = false;
      cancelAnimationFrame(cueRaf);
      cancelAnimationFrame(waitRaf);
      window.clearTimeout(recordTimer);
      if (frameInterval) clearInterval(frameInterval);
      stopRecorder();
    };
  }, [cameraEnabled, paused, recordRequestId, sessionState, videoRef]);

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

      const borderColor = paused ? "rgba(148,163,184,0.45)"
                        : recordingCueState === "recording" ? "#ef4444"
                        : recordingCueState === "countdown" ? "#f59e0b"
                        : "rgba(255,255,255,0.35)";

      ctx.strokeStyle = borderColor;
      ctx.lineWidth = recordingCueState === "recording" ? 3 : 2;
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.stroke();

      // Countdown arc — sweeps clockwise before explicit recording begins
      if (recordingCueState === "countdown" && countdown > 0) {
        ctx.strokeStyle = "rgba(245, 158, 11, 0.82)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, cr, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * countdown);
        ctx.stroke();
      }

      // State label
      if (recordingCueState === "recording") {
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
      if (paused && camState === "active") {
        ctx.fillStyle = "rgba(255,255,255,0.68)";
        ctx.font = "12px system-ui";
        ctx.fillText("Paused", cx, labelY);
      } else if (recordingCueState === "idle" && camState === "active") {
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.font = "12px system-ui";
        ctx.fillText("Press Record attempt when ready", cx, labelY);
      } else if (recordingCueState === "countdown") {
        ctx.fillStyle = "rgba(245,158,11,0.9)";
        ctx.font = "12px system-ui";
        ctx.fillText("Get ready…", cx, labelY);
      } else if (recordingCueState === "recording") {
        ctx.fillStyle = "rgba(239,68,68,0.8)";
        ctx.font = "12px system-ui";
        ctx.fillText("Sign now", cx, labelY);
      }
      ctx.textAlign = "left";

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [camState, recordingCueState, countdown, paused]);

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
      {!cameraEnabled && (
        <div className="absolute inset-0 flex items-center justify-center text-center px-6">
          <p className="text-slate-400 text-sm">Camera paused.</p>
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
