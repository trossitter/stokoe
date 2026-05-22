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

// Swipe detection — two independent triggers (OR'd)
//
// 1. Displacement: slow deliberate swipe
const DISPLACE_THRESHOLD = 0.22;  // fraction of frame width over TRACK_WINDOW_MS
const TRACK_WINDOW_MS = 650;
const MIN_SAMPLES = 5;
//
// 2. Velocity (flick): fast movement over a short window
//    velocity = Δx / Δt in normalised-units / ms
//    threshold ≈ 1.2 frame-widths per second = 0.0012 /ms
const FLICK_VELOCITY = 0.0012;    // normalised units per ms
const FLICK_DISPLACE_FLOOR = 0.08; // minimum total Δx — noise guard
const FLICK_LOOKBACK = 3;          // samples; ~270ms at 90ms cadence
//
const SAMPLE_MS = 90;

type Props = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onComplete: () => void;
};

export function SwipeTutorial({ videoRef, onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const [flyDir, setFlyDir] = useState<"left" | "right" | null>(null);
  const [handSide, setHandSide] = useState<"left" | "center" | "right" | null>(null);

  const indexRef = useRef(0);
  const flyingRef = useRef(false);
  const samplesRef = useRef<Array<{ x: number; ts: number }>>([]);
  const lastSampleRef = useRef(0);
  const captureRef = useRef<HTMLCanvasElement | null>(null);

  const doSwipe = useCallback((dir: "left" | "right") => {
    if (flyingRef.current) return;
    flyingRef.current = true;
    samplesRef.current = [];
    setFlyDir(dir);
    setTimeout(() => {
      setFlyDir(null);
      flyingRef.current = false;
      if (dir === "right") {
        if (indexRef.current >= CARDS.length - 1) {
          onComplete();
          return;
        }
        indexRef.current += 1;
        setIndex(indexRef.current);
      } else if (dir === "left" && indexRef.current > 0) {
        indexRef.current -= 1;
        setIndex(indexRef.current);
      }
    }, 380);
  }, [onComplete]);

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
          // Mirror capture to match the mirrored display so x coords feel natural
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(video, -256, 0, 256, 256);
          ctx.restore();

          const result = landmarker.detect(c);
          if (result.landmarks?.length) {
            const wx = result.landmarks[0][0].x; // wrist, in display coords
            setHandSide(wx < 0.4 ? "left" : wx > 0.6 ? "right" : "center");

            if (!flyingRef.current) {
              samplesRef.current.push({ x: wx, ts: now });
              const cutoff = now - TRACK_WINDOW_MS;
              samplesRef.current = samplesRef.current.filter(s => s.ts > cutoff);

              const s = samplesRef.current;

              // ── Displacement trigger ────────────────────────────────────
              if (s.length >= MIN_SAMPLES) {
                const delta = s[s.length - 1].x - s[0].x;
                if (delta > DISPLACE_THRESHOLD) { doSwipe("right"); }
                else if (delta < -DISPLACE_THRESHOLD) { doSwipe("left"); }
              }

              // ── Velocity / flick trigger ────────────────────────────────
              if (!flyingRef.current && s.length >= FLICK_LOOKBACK) {
                const tail = s.slice(-FLICK_LOOKBACK);
                const dt = tail[tail.length - 1].ts - tail[0].ts;
                if (dt > 0) {
                  const dx = tail[tail.length - 1].x - tail[0].x;
                  const velocity = dx / dt; // normalised units/ms
                  // All samples must move in the same direction (monotonic) —
                  // filters out jitter that happens to be fast
                  const monotonic = tail.every(
                    (_, i) => i === 0 || (tail[i].x - tail[i - 1].x) * dx >= 0,
                  );
                  if (
                    monotonic &&
                    Math.abs(dx) >= FLICK_DISPLACE_FLOOR &&
                    Math.abs(velocity) >= FLICK_VELOCITY
                  ) {
                    doSwipe(dx > 0 ? "right" : "left");
                  }
                }
              }
            }
          } else {
            setHandSide(null);
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
  }, [videoRef, doSwipe]);

  const card = CARDS[index];
  const isLast = index === CARDS.length - 1;
  const cardStyle: React.CSSProperties = {
    transform: flyDir === "right"
      ? "translateX(130%) rotate(18deg)"
      : flyDir === "left"
      ? "translateX(-130%) rotate(-18deg)"
      : "translateX(0) rotate(0)",
    transition: flyDir
      ? "transform 0.38s ease-in"
      : "transform 0.22s ease-out",
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Ignore clicks on the arrow buttons themselves (they stopPropagation)
    const mid = (e.currentTarget as HTMLElement).offsetWidth / 2;
    if (e.clientX >= mid) {
      doSwipe("right");
    } else if (index > 0) {
      doSwipe("left");
    }
  };

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center select-none cursor-pointer"
      style={{ background: "rgba(2, 6, 23, 0.88)", backdropFilter: "blur(12px)" }}
      onClick={handleOverlayClick}
    >
      {/* Progress dots */}
      <div className="flex gap-2 mb-10">
        {CARDS.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i === index ? "w-5 h-2 bg-white" :
              i < index ? "w-2 h-2 bg-slate-500" : "w-2 h-2 bg-slate-700"
            }`}
          />
        ))}
      </div>

      {/* Left / right zone arrows — clickable, stop propagation so overlay split still works */}
      <div className="absolute inset-0 flex items-center justify-between px-5">
        <div
          className={`text-4xl transition-all duration-150 cursor-pointer ${
            index > 0 && handSide === "left"
              ? "text-white opacity-100 scale-125"
              : index > 0
              ? "text-slate-600 opacity-70 scale-100 hover:text-slate-400"
              : "text-slate-800 opacity-30 scale-100"
          }`}
          onClick={(e) => { e.stopPropagation(); if (index > 0) doSwipe("left"); }}
        >←</div>
        <div
          className={`text-4xl transition-all duration-150 cursor-pointer ${
            handSide === "right"
              ? "text-white opacity-100 scale-125"
              : "text-slate-600 opacity-70 scale-100 hover:text-slate-400"
          }`}
          onClick={(e) => { e.stopPropagation(); doSwipe("right"); }}
        >→</div>
      </div>

      {/* Card */}
      <div className="w-72 bg-white rounded-3xl shadow-2xl px-8 py-10" style={cardStyle}>
        <h2 className="text-xl font-bold text-slate-900 mb-4">{card.title}</h2>
        <p className="text-slate-600 text-sm leading-relaxed">{card.body}</p>
      </div>

      {/* Status */}
      <p className="mt-8 text-xs transition-colors duration-200 text-center px-4" style={{
        color: handSide !== null ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)",
      }}>
        {handSide !== null
          ? isLast ? "swipe or click right to start →" : "swipe or click right to continue →"
          : "click right — or show your hand and swipe"}
      </p>
    </div>
  );
}
