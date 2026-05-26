import { useRef, useState, useEffect } from "react";
import type { VocabItem } from "../data/vocab";
import { NOTATION } from "../data/notation";
import { SIGN_VIDEOS } from "../data/videos";

type Props = {
  item: VocabItem;
  hidden: boolean;
  paused?: boolean;
  onToggleHidden: () => void;
};

const SPEED_STEPS = [0.25, 0.5, 0.75, 1.0];

type VideoStatus = {
  itemId: string;
  paused: boolean;
  loading: boolean;
  error: boolean;
};

function PlayPauseButton({
  paused,
  onClick,
  label,
}: {
  paused: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="absolute bottom-2 left-2 flex h-7 items-center justify-center text-white transition-colors hover:bg-black/70"
      style={{ background: "rgba(0,0,0,0.5)", borderRadius: 6, padding: "4px 8px" }}
      aria-label={label}
    >
      {paused ? (
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M3 2.5l10 5.5-10 5.5V2.5z" />
        </svg>
      ) : (
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M4 2h2.5v12H4V2zm5.5 0H12v12H9.5V2z" />
        </svg>
      )}
    </button>
  );
}

function ReferenceToggleButton({
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
      className="absolute bottom-3 right-3 z-20 rounded-md border border-white/10 bg-black/50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-black/70"
      aria-label={hidden ? "Show reference video" : "Hide reference video"}
    >
      {hidden ? "Show" : "Hide"}
    </button>
  );
}

function SpeedStepButton({
  direction,
  disabled,
  label,
  onClick,
}: {
  direction: "slower" | "faster";
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white transition-colors hover:bg-black/70 disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent"
      aria-label={label}
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M3 8h10" strokeLinecap="round" />
        {direction === "faster" && <path d="M8 3v10" strokeLinecap="round" />}
      </svg>
    </button>
  );
}

function Placeholder({ word, reason }: { word: string; reason: "missing" | "error" }) {
  return (
    <div className="aspect-[4/3] w-full flex flex-col items-center justify-center gap-1 bg-slate-800/60 rounded-[28px] border border-slate-700">
      <svg
        className="w-6 h-6 text-slate-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 6.75h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
        />
      </svg>
      <p className="text-xs text-slate-500 text-center leading-tight">
        {reason === "error" ? "Video unavailable" : "No reference video yet"}
        <br />
        <span className="text-slate-500">for {word}</span>
      </p>
    </div>
  );
}

export function SignVideo({ item, hidden, paused = false, onToggleHidden }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [speed, setSpeed] = useState(1.0);
  const [videoStatus, setVideoStatus] = useState<VideoStatus>({
    itemId: item.id,
    paused: false,
    loading: true,
    error: false,
  });

  const videoUrl = SIGN_VIDEOS[item.id];
  const status = videoStatus.itemId === item.id
    ? videoStatus
    : { itemId: item.id, paused: false, loading: true, error: false };

  const updateVideoStatus = (patch: Partial<Omit<VideoStatus, "itemId">>) => {
    setVideoStatus((prev) => {
      const base = prev.itemId === item.id
        ? prev
        : { itemId: item.id, paused: false, loading: true, error: false };
      return { ...base, ...patch, itemId: item.id };
    });
  };

  // Apply playback rate whenever it changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [speed]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (paused) {
      video.pause();
    } else if (videoUrl && !status.error) {
      video.play().catch(() => {});
    }
  }, [paused, status.error, videoUrl]);

  const handlePlayPause = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
    } else {
      v.pause();
    }
  };

  const handleMediaKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onToggleHidden();
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = Number(e.target.value);
    setSpeed(SPEED_STEPS[idx]);
  };

  const speedIndex = SPEED_STEPS.indexOf(speed);
  const currentSpeedIndex = speedIndex === -1 ? SPEED_STEPS.length - 1 : speedIndex;
  const stepSpeed = (direction: "slower" | "faster") => {
    setSpeed((current) => {
      const index = SPEED_STEPS.indexOf(current);
      const safeIndex = index === -1 ? SPEED_STEPS.length - 1 : index;
      const nextIndex = direction === "slower"
        ? Math.max(0, safeIndex - 1)
        : Math.min(SPEED_STEPS.length - 1, safeIndex + 1);
      return SPEED_STEPS[nextIndex];
    });
  };
  const notation = NOTATION[item.id];

  return (
    <section
      className="flex min-w-0 flex-col gap-2"
    >
      {/* Video area */}
      {hidden ? (
        <div
          role="button"
          tabIndex={0}
          onClick={onToggleHidden}
          onKeyDown={handleMediaKeyDown}
          className="relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-[28px] border border-slate-700/60 bg-slate-900/80 text-center transition-colors hover:border-slate-500/80 hover:bg-slate-900"
          style={{ boxShadow: "inset 0 0 60px rgb(0 0 0 / 0.34)" }}
          aria-label="Show reference video"
        >
          <span className="absolute left-5 top-4 text-xs font-medium text-slate-400">Reference</span>
          <p className="text-sm text-slate-400">Reference hidden</p>
          <ReferenceToggleButton hidden={hidden} onToggleHidden={onToggleHidden} />
        </div>
      ) : !videoUrl ? (
        <Placeholder word={item.word} reason="missing" />
      ) : status.error ? (
        <Placeholder word={item.word} reason="error" />
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={onToggleHidden}
          onKeyDown={handleMediaKeyDown}
          className="relative aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-[28px] border border-slate-700/60 bg-slate-900 outline-none transition-colors hover:border-slate-500/80 focus-visible:ring-2 focus-visible:ring-[oklch(0.94_0.042_85)]"
          style={{ boxShadow: "inset 0 0 60px rgb(0 0 0 / 0.34)" }}
          aria-label="Hide reference video"
        >
          {/* Loading pulse — shown until canplay fires */}
          {status.loading && (
            <div className="absolute inset-0 bg-slate-800 animate-pulse" />
          )}
          <span className="absolute left-5 top-4 z-10 text-xs font-medium text-slate-300">Reference</span>
          {/*
            key={item.id} remounts the video element on sign change so the browser
            discards the previous src and resets playback to the beginning automatically.
          */}
          <video
            key={item.id}
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            autoPlay={!paused}
            loop
            muted
            playsInline
            onPlay={() => updateVideoStatus({ paused: false })}
            onPause={() => updateVideoStatus({ paused: true })}
            onCanPlay={() => {
              updateVideoStatus({ loading: false });
              if (videoRef.current) {
                videoRef.current.playbackRate = speed;
              }
            }}
            onWaiting={() => updateVideoStatus({ loading: true })}
            onError={() => updateVideoStatus({ error: true, loading: false })}
          />
          <PlayPauseButton
            paused={status.paused}
            onClick={handlePlayPause}
            label={status.paused ? "Play reference" : "Pause reference"}
          />
          <div
            className="absolute bottom-3 left-12 right-20 z-20 flex h-8 items-center gap-2 rounded-md border border-white/10 bg-black/50 px-2 text-white backdrop-blur"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="text-[10px] uppercase tracking-[0.12em] text-white/55">Speed</span>
            <SpeedStepButton
              direction="slower"
              disabled={currentSpeedIndex === 0}
              label="Slow reference playback"
              onClick={() => stepSpeed("slower")}
            />
            <input
              type="range"
              min={0}
              max={SPEED_STEPS.length - 1}
              step={1}
              value={currentSpeedIndex}
              onClick={(event) => event.stopPropagation()}
              onChange={handleSpeedChange}
              className="h-1 min-w-0 flex-1 cursor-pointer accent-slate-200"
              aria-label="Playback speed"
            />
            <SpeedStepButton
              direction="faster"
              disabled={currentSpeedIndex === SPEED_STEPS.length - 1}
              label="Speed up reference playback"
              onClick={() => stepSpeed("faster")}
            />
            <span className="w-7 text-right text-[10px] text-white/70">
              {speed}×
            </span>
          </div>
          <ReferenceToggleButton hidden={hidden} onToggleHidden={onToggleHidden} />
          {notation && (
            <span
              className="pointer-events-none absolute bottom-14 right-3 z-10 rounded-md border border-white/10 bg-black/35 px-2.5 py-1 text-xs tracking-[0.16em] text-slate-300 backdrop-blur"
              style={{ fontFamily: "StokoeTempo, monospace" }}
              title={notation.readable}
            >
              {notation.ascii}
            </span>
          )}
        </div>
      )}
    </section>
  );
}
