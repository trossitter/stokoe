import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  index: number;
  setIndex: (updater: (i: number) => number) => void;
  count: number;
  locked?: boolean;
  exiting?: boolean;
  children: React.ReactNode;
};

export function Carousel({ index, setIndex, count, locked = false, exiting = false, children }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ startX: number; dx: number } | null>(null);
  const [stageWidth, setStageWidth] = useState(0);

  useEffect(() => {
    function measure() {
      setStageWidth(stageRef.current?.offsetWidth ?? 0);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (locked) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        setIndex((i) => Math.min(i + 1, count - 1));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Home") {
        setIndex(() => 0);
      } else if (e.key === "End") {
        setIndex(() => count - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count, setIndex, locked]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (locked) return;
    if ((e.target as Element).closest("[data-no-drag]")) return;
    stageRef.current?.setPointerCapture(e.pointerId);
    setDrag({ startX: e.clientX, dx: 0 });
  }, [locked]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag) return;
    setDrag((d) => d ? { ...d, dx: e.clientX - d.startX } : null);
  }, [drag]);

  const onPointerUp = useCallback(() => {
    if (!drag) return;
    const w = stageRef.current?.offsetWidth ?? 1;
    const ratio = drag.dx / w;
    if (ratio < -0.18) setIndex((i) => Math.min(i + 1, count - 1));
    else if (ratio > 0.18) setIndex((i) => Math.max(i - 1, 0));
    setDrag(null);
  }, [drag, count, setIndex]);

  const w = stageWidth;
  const dragOffset = drag ? drag.dx : 0;
  const atStart = index === 0 && dragOffset > 0;
  const atEnd = index === count - 1 && dragOffset < 0;
  const eff = atStart || atEnd ? dragOffset * 0.25 : dragOffset;
  const tx = -index * 100 + (w ? (eff / w) * 100 : 0);

  return (
    <div
      ref={stageRef}
      className={`ob-stage${drag ? " dragging" : ""}${exiting ? " exiting" : ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        className="ob-track"
        style={{
          transform: `translate3d(${tx}%,0,0)`,
          transition: drag ? "none" : "transform 760ms cubic-bezier(.2,.7,.2,1)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
