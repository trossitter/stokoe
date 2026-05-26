import { useEffect, useRef, useState } from "react";
import { captureFrame, useWebcam } from "../hooks/useWebcam";
import { getRecordingMimeType } from "./recordingSupport";

const ROI = { x: 0.12, y: 0.05, w: 0.76, h: 0.9 };
const COUNTDOWN_STEPS = 3;
const COUNTDOWN_MS = 3000;
const RECORD_DURATION_MS = 2200;
const FRAME_INTERVAL_MS = 100;
const REPLAY_FRAME_MAX_WIDTH = 640;

type Props = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  sessionState: "idle" | "recording" | "evaluating" | "result";
  paused?: boolean;
  cameraEnabled?: boolean;
  hidden?: boolean;
  recordRequestId?: number;
  onFramesReady: (frames: ImageData[]) => void;
  onRecordingReady: (url: string) => void;
  onRecordingFramesReady?: (frames: string[]) => void;
  onToggleHidden: () => void;
  showToggleButton?: boolean;
  overlay?: React.ReactNode;
};

type RecordingCueState = "idle" | "countdown" | "recording";

function captureReplayFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) return null;

  const scale = Math.min(1, REPLAY_FRAME_MAX_WIDTH / width);
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/webp", 0.72);
}

function SelfViewToggleButton({
  hidden,
  onToggleHidden,
}: {
  hidden: boolean;
  onToggleHidden: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggleHidden();
      }}
      className="absolute bottom-3 right-3 z-50 rounded-md border border-white/10 bg-black/50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-black/70"
      aria-label={hidden ? "Show self-view" : "Hide self-view"}
    >
      {hidden ? "Show" : "Hide"}
    </button>
  );
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
  onRecordingFramesReady,
  onToggleHidden,
  showToggleButton = true,
  overlay,
}: Props) {
  const onRecordingReadyRef = useRef(onRecordingReady);
  const onRecordingFramesReadyRef = useRef(onRecordingFramesReady);
  const onFramesReadyRef = useRef(onFramesReady);
  const liveVideoRef = useRef(videoRef);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const replayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [recordingCueState, setRecordingCueState] = useState<RecordingCueState>("idle");
  const [countdown, setCountdown] = useState(0);

  const camState = useWebcam(videoRef, cameraEnabled);

  useEffect(() => {
    onRecordingReadyRef.current = onRecordingReady;
  }, [onRecordingReady]);

  useEffect(() => {
    onRecordingFramesReadyRef.current = onRecordingFramesReady;
  }, [onRecordingFramesReady]);

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
    const replayFrames: string[] = [];
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
      if (!recorder && replayFrames.length > 0) {
        onRecordingFramesReadyRef.current?.(replayFrames);
      }
      setRecordingCueState("idle");
      setCountdown(0);
      onFramesReadyRef.current(frames);
    };

    const beginRecording = (video: HTMLVideoElement) => {
      setRecordingCueState("recording");
      setCountdown(1);

      const stream = video.srcObject as MediaStream | null;
      if (stream && typeof MediaRecorder !== "undefined") {
        try {
          const mimeType = getRecordingMimeType();
          recorder = mimeType === null
            ? null
            : new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

          if (recorder) {
            recorder.ondataavailable = (e) => {
              if (e.data.size > 0) chunks.push(e.data);
            };
            recorder.onstop = () => {
              if (chunks.length === 0) {
                onRecordingFramesReadyRef.current?.(replayFrames);
                return;
              }

              const firstBlobChunk = chunks.find((chunk): chunk is Blob => chunk instanceof Blob);
              const blobType = recorder?.mimeType || firstBlobChunk?.type || "video/webm";
              const blob = new Blob(chunks, { type: blobType });
              const url = URL.createObjectURL(blob);
              onRecordingReadyRef.current(url);
            };
            recorder.start(FRAME_INTERVAL_MS);
          }
        } catch {
          recorder = null;
        }
      }

      const grabFrame = () => {
        if (!captureCanvasRef.current) {
          captureCanvasRef.current = document.createElement("canvas");
        }
        if (!replayCanvasRef.current) {
          replayCanvasRef.current = document.createElement("canvas");
        }
        const frame = captureFrame(video, captureCanvasRef.current, ROI);
        if (frame) frames.push(frame);

        const replayFrame = captureReplayFrame(video, replayCanvasRef.current);
        if (replayFrame) replayFrames.push(replayFrame);
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

  return (
    <section
      role="button"
      tabIndex={0}
      onClick={onToggleHidden}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggleHidden();
        }
      }}
      className="h-full w-full overflow-hidden relative rounded-[28px] border border-slate-700/60"
      style={{ background: "oklch(0.12 0.02 260)", boxShadow: "inset 0 0 60px rgb(0 0 0 / 0.34)" }}
      aria-label={hidden ? "Show self-view" : "Hide self-view"}
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
          <p className="text-slate-400 text-sm">Camera off.</p>
        </div>
      )}
      <span className="absolute left-5 top-4 z-20 text-xs font-medium text-slate-300">Self-view</span>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-contain transition-opacity duration-300 ${hidden ? "opacity-0" : "opacity-100"}`}
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
      {recordingCueState === "recording" && !hidden && (
        <div className="absolute bottom-3 left-3 z-30 rounded-md border border-red-300/20 bg-red-950/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-red-200">
          REC
        </div>
      )}
      {showToggleButton && (
        <SelfViewToggleButton hidden={hidden} onToggleHidden={onToggleHidden} />
      )}
      {recordingCueState === "countdown" && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center rounded-[28px] pointer-events-none"
          style={{
            background: "oklch(0.12 0.02 260 / 0.58)",
            backdropFilter: "blur(3px)",
          }}
        >
          <div
            className="flex h-32 w-32 items-center justify-center rounded-full border shadow-2xl"
            style={{
              background: "oklch(0.18 0.024 260 / 0.72)",
              borderColor: "oklch(0.94 0.042 85 / 0.45)",
              boxShadow: "0 0 40px oklch(0.94 0.042 85 / 0.16)",
            }}
          >
            <span
              className="text-7xl leading-none"
              style={{
                color: "oklch(0.94 0.042 85)",
                fontFamily: "'Newsreader', Georgia, serif",
              }}
            >
              {Math.max(1, COUNTDOWN_STEPS - Math.floor(countdown * COUNTDOWN_STEPS))}
            </span>
          </div>
        </div>
      )}
      {overlay}
    </section>
  );
}
