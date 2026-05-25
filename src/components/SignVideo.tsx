import { useRef, useState, useEffect } from "react";
import type { VocabItem } from "../data/vocab";
import { SIGN_VIDEOS } from "../data/videos";

type Props = {
  item: VocabItem;
  hidden: boolean;
};

const SPEED_STEPS = [0.25, 0.5, 0.75, 1.0];

function Placeholder({ word, reason }: { word: string; reason: "missing" | "error" }) {
  return (
    <div className="aspect-video flex flex-col items-center justify-center gap-1 bg-slate-800/60 rounded-xl border border-slate-700">
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

export function SignVideo({ item, hidden }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const videoUrl = SIGN_VIDEOS[item.id];

  // Reset error/loading state when the item changes (video remounts via key)
  useEffect(() => {
    setError(false);
    setLoading(true);
    setPaused(false);
  }, [item.id]);

  // Apply playback rate whenever it changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [speed]);

  if (hidden) return null;

  const handlePlayPause = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
    } else {
      v.pause();
    }
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = Number(e.target.value);
    setSpeed(SPEED_STEPS[idx]);
  };

  const speedIndex = SPEED_STEPS.indexOf(speed);

  return (
    <section
      className="rounded-2xl shadow-sm border p-3 flex flex-col gap-2"
      style={{
        background: "oklch(0.26 0.030 260 / 0.75)",
        backdropFilter: "blur(8px)",
        borderColor: "oklch(0.36 0.028 260 / 0.6)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">Reference</span>
        {videoUrl && !error && (
          <button
            onClick={handlePlayPause}
            className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 transition-colors"
            aria-label={paused ? "Play" : "Pause"}
          >
            {paused ? (
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3 2.5l10 5.5-10 5.5V2.5z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 2h2.5v12H4V2zm5.5 0H12v12H9.5V2z" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Video area */}
      {!videoUrl ? (
        <Placeholder word={item.word} reason="missing" />
      ) : error ? (
        <Placeholder word={item.word} reason="error" />
      ) : (
        <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900">
          {/* Loading pulse — shown until canplay fires */}
          {loading && (
            <div className="absolute inset-0 bg-slate-800 animate-pulse rounded-xl" />
          )}
          {/*
            key={item.id} remounts the video element on sign change so the browser
            discards the previous src and resets playback to the beginning automatically.
          */}
          <video
            key={item.id}
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            onPlay={() => setPaused(false)}
            onPause={() => setPaused(true)}
            onCanPlay={() => {
              setLoading(false);
              if (videoRef.current) {
                videoRef.current.playbackRate = speed;
              }
            }}
            onWaiting={() => setLoading(true)}
            onError={() => { setError(true); setLoading(false); }}
          />
        </div>
      )}

      {/* Speed controls — only shown when video is available */}
      {videoUrl && !error && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 shrink-0">Speed</span>
          <input
            type="range"
            min={0}
            max={SPEED_STEPS.length - 1}
            step={1}
            value={speedIndex === -1 ? SPEED_STEPS.length - 1 : speedIndex}
            onChange={handleSpeedChange}
            className="flex-1 h-1 accent-slate-400 cursor-pointer"
            aria-label="Playback speed"
          />
          <span className="text-xs text-slate-400 w-8 text-right shrink-0">
            {speed}×
          </span>
        </div>
      )}
    </section>
  );
}
