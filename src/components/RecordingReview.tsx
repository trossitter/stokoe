import { useRef, useState } from "react";

type Props = {
  url: string;
  overlay?: React.ReactNode;
};

export function RecordingReview({ url, overlay }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
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
        autoPlay
        loop
        muted
        playsInline
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "scaleX(-1)",
        }}
      />

      <button
        onClick={handlePlayPause}
        className="absolute bottom-7 left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center text-white transition-colors hover:bg-black/70"
        style={{ background: "rgba(0,0,0,0.5)", borderRadius: 6 }}
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
