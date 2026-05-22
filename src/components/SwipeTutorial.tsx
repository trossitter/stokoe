import { useState, useRef } from "react";

type Card = {
  title: string;
  body: string;
  hint: string;
};

const CARDS: Card[] = [
  {
    title: "Welcome to Stokoe",
    body: "Practice ASL vocabulary using your camera. Real phonological analysis — the same three-part system linguists use.",
    hint: "swipe right to continue →",
  },
  {
    title: "Hold your hand here",
    body: "A box appears on screen. Place your signing hand inside it and hold still. The system detects when you're ready and starts automatically.",
    hint: "swipe right to continue →",
  },
  {
    title: "Three things we watch",
    body: "Location (Tab), handshape (Dez), and movement (Sig). When something's off you get a specific hint — not just \"try again.\"",
    hint: "swipe right to continue →",
  },
  {
    title: "Ready",
    body: "Your camera will come live. Sign when the box glows green.",
    hint: "swipe right to start →",
  },
];

const SWIPE_THRESHOLD = 70;

type Props = {
  onComplete: () => void;
};

export function SwipeTutorial({ onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState(0);
  const startX = useRef<number | null>(null);
  const isDragging = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    isDragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || startX.current === null) return;
    setDrag(e.clientX - startX.current);
  };

  const onPointerUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const dist = drag;
    setDrag(0);
    startX.current = null;

    if (dist > SWIPE_THRESHOLD) {
      // right swipe → advance
      if (index >= CARDS.length - 1) {
        onComplete();
      } else {
        setIndex((i) => i + 1);
      }
    } else if (dist < -SWIPE_THRESHOLD && index > 0) {
      // left swipe → go back
      setIndex((i) => i - 1);
    }
  };

  const card = CARDS[index];
  const rotation = drag * 0.04;
  const cardOpacity = Math.max(0.4, 1 - Math.abs(drag) * 0.003);

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center"
      style={{ background: "rgba(2, 6, 23, 0.88)", backdropFilter: "blur(12px)" }}
    >
      {/* Progress dots */}
      <div className="flex gap-2 mb-8">
        {CARDS.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i === index
                ? "w-5 h-2 bg-white"
                : i < index
                ? "w-2 h-2 bg-slate-500"
                : "w-2 h-2 bg-slate-700"
            }`}
          />
        ))}
      </div>

      {/* Swipeable card */}
      <div
        className="w-72 select-none cursor-grab active:cursor-grabbing"
        style={{
          transform: `translateX(${drag}px) rotate(${rotation}deg)`,
          opacity: cardOpacity,
          transition: drag === 0 ? "transform 0.25s ease, opacity 0.25s ease" : "none",
          touchAction: "none",
          willChange: "transform",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="bg-white rounded-3xl shadow-2xl px-8 py-10">
          <h2 className="text-xl font-bold text-slate-900 mb-4">{card.title}</h2>
          <p className="text-slate-600 text-sm leading-relaxed">{card.body}</p>
        </div>
      </div>

      {/* Swipe hint */}
      <p
        className="mt-8 text-slate-500 text-xs tracking-wide transition-opacity duration-200"
        style={{ opacity: Math.abs(drag) > 20 ? 0 : 1 }}
      >
        {card.hint}
      </p>

      {/* Back affordance */}
      {index > 0 && (
        <p className="mt-2 text-slate-700 text-xs">← swipe left to go back</p>
      )}
    </div>
  );
}
