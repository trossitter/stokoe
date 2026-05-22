import { useState, useRef, useEffect, useCallback } from "react";
import { getHandLandmarker } from "../model/handLandmarker";

type Card = { title: string; body: string };

const CARDS: Card[] = [
  {
    title: "Welcome to Stokoe",
    body: "Practice ASL vocabulary using your camera. Real phonological analysis — the same three-part system linguists use.",
  },
  {
    title: "Hold your hand here",
    body: "A box will appear on screen. Place your signing hand inside it and hold still. Recording starts automatically.",
  },
  {
    title: "Three things we watch",
    body: "Location (Tab), handshape (Dez), and movement (Sig). When something's off you get a specific hint — not just \"try again.\"",
  },
  {
    title: "Ready",
    body: "Sign when the box glows green.",
  },
];

// Pastel palette — one per card, deepening as you advance
const PALETTES = [
  { bg: "#F0EBFF", title: "#5C3D99", body: "#7A5AB8", dot: "#9B7DD4" }, // lavender
  { bg: "#DCF5EC", title: "#1A6B4A", body: "#2E8A63", dot: "#3DAD7C" }, // mint
  { bg: "#FFE9F0", title: "#A0365C", body: "#C25678", dot: "#D97094" }, // rose
  { bg: "#FEF0DC", title: "#934D10", body: "#B56820", dot: "#D4883A" }, // amber
] as const;

// Detection — rightward only
const DISPLACE_THRESHOLD = 0.22;
const TRACK_WINDOW_MS = 650;
const MIN_SAMPLES = 5;
const FLICK_VELOCITY = 0.0012;
const FLICK_DISPLACE_FLOOR = 0.08;
const FLICK_LOOKBACK = 3;
const SAMPLE_MS = 90;

type Props = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onComplete: () => void;
};

export function SwipeTutorial({ videoRef, onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const [flyDir, setFlyDir] = useState<"right" | null>(null);
  const [handOnRight, setHandOnRight] = useState(false);
  const [handDetected, setHandDetected] = useState(false);

  const indexRef = useRef(0);
  const flyingRef = useRef(false);
  const samplesRef = useRef<Array<{ x: number; ts: number }>>([]);
  const lastSampleRef = useRef(0);
  const captureRef = useRef<HTMLCanvasElement | null>(null);

  const advance = useCallback(() => {
    if (flyingRef.current) return;
    flyingRef.current = true;
    samplesRef.current = [];
    setFlyDir("right");
    setTimeout(() => {
      setFlyDir(null);
      flyingRef.current = false;
      if (indexRef.current >= CARDS.length - 1) {
        onComplete();
        return;
      }
      indexRef.current += 1;
      setIndex(indexRef.current);
    }, 380);
  }, [onComplete]);

  // Hand swipe detection loop
  useEffect(() => {
    let alive = true;

    const tick = async (now: number) => {
      if (!alive) return;

      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        requestAnimationFrame(tick);
        return;
      }

      if (now - lastSampleRef.current >= SAMPLE_MS) {
        lastSampleRef.current = now;

        try {
          const landmarker = await getHandLandmarker();

          if (!captureRef.current) captureRef.current = document.createElement("canvas");
          const c = captureRef.current;
          c.width = 256; c.height = 256;
          const ctx = c.getContext("2d")!;
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(video, -256, 0, 256, 256);
          ctx.restore();

          const result = landmarker.detect(c);
          if (result.landmarks?.length) {
            const wx = result.landmarks[0][0].x;
            setHandDetected(true);
            setHandOnRight(wx > 0.55);

            if (!flyingRef.current) {
              samplesRef.current.push({ x: wx, ts: now });
              const cutoff = now - TRACK_WINDOW_MS;
              samplesRef.current = samplesRef.current.filter(s => s.ts > cutoff);

              const s = samplesRef.current;

              // Displacement trigger
              if (s.length >= MIN_SAMPLES) {
                const delta = s[s.length - 1].x - s[0].x;
                if (delta > DISPLACE_THRESHOLD) { advance(); }
              }

              // Velocity / flick trigger (rightward only)
              if (!flyingRef.current && s.length >= FLICK_LOOKBACK) {
                const tail = s.slice(-FLICK_LOOKBACK);
                const dt = tail[tail.length - 1].ts - tail[0].ts;
                if (dt > 0) {
                  const dx = tail[tail.length - 1].x - tail[0].x;
                  const velocity = dx / dt;
                  const monotonic = tail.every(
                    (_, i) => i === 0 || tail[i].x >= tail[i - 1].x,
                  );
                  if (
                    dx > 0 &&
                    monotonic &&
                    dx >= FLICK_DISPLACE_FLOOR &&
                    velocity >= FLICK_VELOCITY
                  ) { advance(); }
                }
              }
            }
          } else {
            setHandDetected(false);
            setHandOnRight(false);
            samplesRef.current = [];
          }
        } catch {
          // landmarker loading — skip frame
        }
      }

      if (alive) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
    return () => { alive = false; };
  }, [videoRef, advance]);

  const palette = PALETTES[index];
  const isLast = index === CARDS.length - 1;

  const cardFlyStyle: React.CSSProperties = flyDir === "right"
    ? { transform: "translateX(130%) rotate(18deg)", transition: "transform 0.38s ease-in, opacity 0.3s ease-in", opacity: 0 }
    : {};

  return (
    <>
      {/* Card-in keyframe — injected once */}
      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateX(28px) rotate(3deg); }
          to   { opacity: 1; transform: translateX(0)    rotate(0deg); }
        }
      `}</style>

      <div
        className="absolute inset-0 z-20 flex flex-col items-center justify-center select-none cursor-pointer"
        style={{ background: "rgba(2, 6, 23, 0.88)", backdropFilter: "blur(24px) brightness(0.6)" }}
        onClick={advance}
      >
        {/* Progress dots — current dot takes the card's palette colour */}
        <div className="flex gap-2 mb-10">
          {CARDS.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-400"
              style={{
                width: i === index ? "20px" : "8px",
                height: "8px",
                background: i === index ? palette.dot : i < index ? "#475569" : "#1e293b",
              }}
            />
          ))}
        </div>

        {/* Card — remounts on each index so cardIn animation fires fresh */}
        <div
          key={index}
          className="w-72 rounded-3xl shadow-2xl px-8 py-10"
          style={{
            background: palette.bg,
            ...cardFlyStyle,
            ...(flyDir ? {} : { animation: "cardIn 0.32s cubic-bezier(0.2, 0.8, 0.3, 1)" }),
          }}
        >
          <h2 className="text-xl font-bold mb-4" style={{ color: palette.title }}>
            {CARDS[index].title}
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: palette.body }}>
            {CARDS[index].body}
          </p>
        </div>

        {/* Rightward arc cue — glows when hand is on right side */}
        <div className="mt-8 flex items-center gap-2">
          <span
            className="text-2xl transition-all duration-200"
            style={{
              opacity: handOnRight ? 1 : 0.25,
              transform: handOnRight ? "scale(1.2)" : "scale(1)",
              color: handOnRight ? palette.dot : "#e2e8f0",
            }}
          >→</span>
          <p className="text-xs" style={{ color: handDetected ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.28)" }}>
            {handDetected
              ? isLast ? "swipe right or tap to begin" : "swipe right or tap to continue"
              : "tap — or show your hand and swipe right"}
          </p>
        </div>
      </div>
    </>
  );
}
