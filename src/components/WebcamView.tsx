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
  hidden?: boolean;
  recordRequestId?: number;
  onFramesReady: (frames: ImageData[]) => void;
  onRecordingReady: (url: string) => void;
  overlay?: React.ReactNode;
};

type RecordingCueState = "idle" | "countdown" | "recording";

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

export function WebcamView({
  videoRef,
  sessionState,
  paused = false,
  cameraEnabled = true,
  hidden = false,
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

      const borderColor = paused ? "rgba(148,163,184,0.45)"
                        : recordingCueState === "recording" ? "#ef4444"
                        : recordingCueState === "countdown" ? "#f59e0b"
                        : "rgba(255,255,255,0.22)";

      ctx.strokeStyle = borderColor;
      ctx.lineWidth = recordingCueState === "recording" ? 3 : 2;
      drawRoundedRect(ctx, rx, ry, rw, rh, 24);
      ctx.stroke();

      // Countdown cue — a quiet line so the learner is not looking through a ring.
      if (recordingCueState === "countdown" && countdown > 0) {
        const progressX = rx + 18;
        const progressY = ry + rh - 16;
        const progressW = rw - 36;
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.strokeStyle = "rgba(245,158,11,0.22)";
        ctx.beginPath();
        ctx.moveTo(progressX, progressY);
        ctx.lineTo(progressX + progressW, progressY);
        ctx.stroke();
        ctx.strokeStyle = "rgba(245,158,11,0.9)";
        ctx.beginPath();
        ctx.moveTo(progressX, progressY);
        ctx.lineTo(progressX + progressW * countdown, progressY);
        ctx.stroke();
        ctx.lineCap = "butt";
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

      // Guide instruction — keep this sparse; the primary prompt lives in the center card.
      const labelY = Math.min(h - 14, ry + rh - 14);
      ctx.textAlign = "center";
      if (paused && camState === "active") {
        ctx.fillStyle = "rgba(255,255,255,0.68)";
        ctx.font = "12px system-ui";
        ctx.fillText("Paused", rx + rw / 2, labelY);
      } else if (recordingCueState === "countdown") {
        ctx.fillStyle = "rgba(245,158,11,0.9)";
        ctx.font = "12px system-ui";
        ctx.fillText("Get ready", rx + rw / 2, labelY);
      } else if (recordingCueState === "recording") {
        ctx.fillStyle = "rgba(239,68,68,0.8)";
        ctx.font = "12px system-ui";
        ctx.fillText("Sign now", rx + rw / 2, labelY);
      }
      ctx.textAlign = "left";

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [camState, recordingCueState, countdown, paused]);

  return (
    <section
      className="h-full w-full overflow-hidden relative rounded-[28px] border border-slate-700/60"
      style={{ background: "oklch(0.12 0.02 260)", boxShadow: "inset 0 0 60px rgb(0 0 0 / 0.34)" }}
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
        className={`w-full h-full object-cover transition-opacity duration-300 ${hidden ? "opacity-0" : "opacity-100"}`}
        style={{
          transform: "scaleX(-1)",
          filter: "saturate(0.82) contrast(0.92) brightness(0.9)",
        }}
      />
      {hidden && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80 px-6 text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Self-view hidden</p>
        </div>
      )}
      {!hidden && (
        <div className="absolute inset-0 pointer-events-none bg-slate-950/10" />
      )}
      <canvas
        ref={overlayRef}
        className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300 ${
          hidden ? "opacity-0" : "opacity-100"
        }`}
      />
      {overlay}
    </section>
  );
}
