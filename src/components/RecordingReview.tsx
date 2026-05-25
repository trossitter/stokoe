import { type ChangeEvent, type ReactNode, useEffect, useRef, useState } from "react";

const SPEED_STEPS = [0.25, 0.5, 0.75, 1.0];

type Props = {
  url: string;
  paused?: boolean;
  overlay?: ReactNode;
};

export function RecordingReview({ url, paused: practicePaused = false, overlay }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const speedIndex = SPEED_STEPS.indexOf(speed);

  const handlePlayPause = () => {
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

  const handleSpeedChange = (event: ChangeEvent<HTMLInputElement>) => {
    const index = Number(event.target.value);
    setSpeed(SPEED_STEPS[index]);
  };

  return (
    <section
      className="flex-1 relative overflow-hidden min-h-0"
      style={{
        background: "oklch(0.12 0.02 260)",
        borderRadius: "50%",
        clipPath: "circle(50% at 50% 50%)",
      }}
    >
      <video
        key={url}
        ref={videoRef}
        src={url}
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
          objectFit: "cover",
          transform: "scaleX(-1)",
        }}
      />

      <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-md border border-white/10 bg-black/50 px-2 py-1 text-white backdrop-blur">
        <button
          onClick={handlePlayPause}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white transition-colors hover:bg-black/70"
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
        <input
          type="range"
          min={0}
          max={SPEED_STEPS.length - 1}
          step={1}
          value={speedIndex === -1 ? SPEED_STEPS.length - 1 : speedIndex}
          onChange={handleSpeedChange}
          className="h-1 w-20 cursor-pointer accent-slate-200"
          aria-label="Attempt playback speed"
        />
        <span className="w-7 text-right text-[10px] text-white/70">
          {speed}×
        </span>
      </div>

      <span
        className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap"
        style={{
          color: "rgba(255,255,255,0.55)",
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: 10,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        Your attempt
      </span>
      {overlay}
    </section>
  );
}
