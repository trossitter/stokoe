import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  onCommit: () => void;
  active?: boolean;
  label?: string;
  finishedLabel?: string;
};

export function SwipeTrack({ onCommit, active = true, label = "Swipe to begin", finishedLabel = "Ready" }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(0);
  const [armed, setArmed] = useState(false);
  const [rangeState, setRangeState] = useState(1);
  const rangeRef = useRef(1);
  const draggingRef = useRef(false);
  const startRef = useRef(0);
  const startXRef = useRef(0);

  useEffect(() => {
    function updateRange() {
      const t = trackRef.current;
      const k = knobRef.current;
      if (!t || !k) return;
      const v = Math.max(1, t.offsetWidth - k.offsetWidth - 12);
      rangeRef.current = v;
      setRangeState(v);
    }
    updateRange();
    window.addEventListener("resize", updateRange);
    return () => window.removeEventListener("resize", updateRange);
  }, []);

  const onDown = useCallback((e: React.PointerEvent) => {
    if (armed) return;
    e.stopPropagation();
    draggingRef.current = true;
    startRef.current = x * rangeRef.current;
    startXRef.current = e.clientX;
    knobRef.current?.setPointerCapture(e.pointerId);
  }, [x, armed]);

  const onMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - startXRef.current;
    setX(Math.min(1, Math.max(0, (startRef.current + dx) / rangeRef.current)));
  }, []);

  const onUp = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (x > 0.88) {
      setX(1);
      setArmed(true);
      setTimeout(() => onCommit(), 380);
    } else {
      setX(0);
    }
  }, [x, onCommit]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!active || armed) return;
      if (e.key === " " || e.key === "Enter" || e.key === "ArrowRight") {
        e.preventDefault();
        setX(1);
        setArmed(true);
        setTimeout(() => onCommit(), 480);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, armed, onCommit]);

  return (
    <div
      ref={trackRef}
      className={`ob-swipe-track${armed ? " armed" : ""}`}
      data-no-drag
    >
      <div className="ob-st-fill" style={{ width: `${x * 100}%` }} />
      <div className="ob-st-label" style={{ opacity: armed ? 0 : 1 - x * 0.85 }}>
        {label}
      </div>
      <div className="ob-st-label" style={{ opacity: armed ? 1 : 0, color: "var(--accent-ink)" }}>
        {finishedLabel}
      </div>
      <div
        ref={knobRef}
        className="ob-st-knob"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        style={{ transform: `translateX(${x * rangeState}px)` }}
        role="slider"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(x * 100)}
        tabIndex={0}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12 L19 12 M13 6 L19 12 L13 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
        </svg>
      </div>
    </div>
  );
}
