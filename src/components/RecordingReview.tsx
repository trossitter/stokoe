import { type ChangeEvent, type ReactNode, useEffect, useRef, useState } from "react";

const SPEED_STEPS = [0.25, 0.5, 0.75, 1.0];
const FALLBACK_FRAME_MS = 100;

type Props = {
  url?: string | null;
  frames?: string[];
  paused?: boolean;
  hidden?: boolean;
  onToggleHidden: () => void;
  overlay?: ReactNode;
};

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
      className="absolute bottom-3 right-3 z-20 rounded-md border border-white/10 bg-black/50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-black/70"
      aria-label={hidden ? "Show self-view" : "Hide self-view"}
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

export function RecordingReview({
  url,
  frames = [],
  paused: practicePaused = false,
  hidden = false,
  onToggleHidden,
  overlay,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaKey = url ?? frames[0] ?? "";
  const [pauseState, setPauseState] = useState({ mediaKey: "", paused: false });
  const [frameState, setFrameState] = useState({ mediaKey: "", index: 0 });
  const [speed, setSpeed] = useState(1.0);
  const speedIndex = SPEED_STEPS.indexOf(speed);
  const hasVideo = !!url;
  const hasFrameFallback = !hasVideo && frames.length > 0;
  const paused = pauseState.mediaKey === mediaKey ? pauseState.paused : false;
  const frameIndex = frameState.mediaKey === mediaKey && frames.length > 0 ? frameState.index % frames.length : 0;
  const setPaused = (next: boolean | ((current: boolean) => boolean)) => {
    setPauseState((current) => {
      const currentPaused = current.mediaKey === mediaKey ? current.paused : false;
      return {
        mediaKey,
        paused: typeof next === "function" ? next(currentPaused) : next,
      };
    });
  };

  const handlePlayPause = () => {
    if (hasFrameFallback) {
      setPaused((current) => !current);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = speed;

    if (practicePaused) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }, [practicePaused, speed, url]);

  useEffect(() => {
    if (!hasFrameFallback || practicePaused || paused || frames.length <= 1) return;

    const frameMs = Math.max(40, FALLBACK_FRAME_MS / speed);
    const intervalId = window.setInterval(() => {
      setFrameState((current) => {
        const currentIndex = current.mediaKey === mediaKey ? current.index : 0;
        return { mediaKey, index: (currentIndex + 1) % frames.length };
      });
    }, frameMs);

    return () => window.clearInterval(intervalId);
  }, [frames.length, hasFrameFallback, mediaKey, paused, practicePaused, speed]);

  const handleSpeedChange = (event: ChangeEvent<HTMLInputElement>) => {
    const index = Number(event.target.value);
    setSpeed(SPEED_STEPS[index]);
  };
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
      className="h-full w-full relative overflow-hidden rounded-[28px] border border-slate-700/60"
      style={{
        background: "oklch(0.12 0.02 260)",
        boxShadow: "inset 0 0 60px rgb(0 0 0 / 0.34)",
      }}
      aria-label={hidden ? "Show self-view" : "Hide self-view"}
    >
      <span className="absolute left-5 top-4 z-20 text-xs font-medium text-slate-300">Your attempt</span>
      {hasVideo ? (
        <video
          key={url}
          ref={videoRef}
          src={url ?? undefined}
          autoPlay={!practicePaused}
          loop
          muted
          playsInline
          onPlay={() => setPaused(false)}
          onPause={() => setPaused(true)}
          onCanPlay={() => {
            if (videoRef.current) {
              videoRef.current.playbackRate = speed;
            }
          }}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            transform: "scaleX(-1)",
            filter: "saturate(0.82) contrast(0.92) brightness(0.9)",
            opacity: hidden ? 0 : 1,
            transition: "opacity 300ms ease",
          }}
        />
      ) : hasFrameFallback ? (
        <img
          src={frames[frameIndex] ?? frames[0]}
          alt=""
          aria-hidden="true"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            transform: "scaleX(-1)",
            filter: "saturate(0.82) contrast(0.92) brightness(0.9)",
            opacity: hidden ? 0 : 1,
            transition: "opacity 300ms ease",
          }}
        />
      ) : (
        <div className="h-full w-full" />
      )}

      {hidden && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80 px-6 text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Self-view hidden</p>
        </div>
      )}

      {!hidden && (
        <div className="absolute inset-0 pointer-events-none bg-slate-950/10" />
      )}

      {!hidden && (
      <>
        <button
          onClick={(event) => {
            event.stopPropagation();
            handlePlayPause();
          }}
          className="absolute bottom-3 left-3 z-20 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white transition-colors hover:bg-black/70"
          style={{ background: "rgba(0,0,0,0.5)" }}
          aria-label={paused ? "Play your attempt" : "Pause your attempt"}
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
        <div
          className="absolute bottom-3 left-12 right-20 z-20 flex h-8 items-center gap-2 rounded-md border border-white/10 bg-black/50 px-2 text-white backdrop-blur"
          onClick={(event) => event.stopPropagation()}
        >
          <span className="text-[10px] uppercase tracking-[0.12em] text-white/55">Speed</span>
          <SpeedStepButton
            direction="slower"
            disabled={currentSpeedIndex === 0}
            label="Slow attempt playback"
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
            aria-label="Attempt playback speed"
          />
          <SpeedStepButton
            direction="faster"
            disabled={currentSpeedIndex === SPEED_STEPS.length - 1}
            label="Speed up attempt playback"
            onClick={() => stepSpeed("faster")}
          />
          <span className="w-7 text-right text-[10px] text-white/70">
            {speed}×
          </span>
        </div>
      </>
      )}
      <SelfViewToggleButton hidden={hidden} onToggleHidden={onToggleHidden} />
      {overlay}
    </section>
  );
}
