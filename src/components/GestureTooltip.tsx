import { useEffect, useState } from "react";

const STORAGE_KEY = "stokoe_gesture_hint_seen";

export function GestureTooltip({ visible }: { visible: boolean }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    const showTimer = setTimeout(() => setShow(true), 800);
    const hideTimer = setTimeout(() => {
      setShow(false);
      localStorage.setItem(STORAGE_KEY, "1");
    }, 5000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [visible]);

  if (!show) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-16 z-40 flex justify-center"
      style={{ opacity: show ? 1 : 0, transition: "opacity 0.4s ease" }}
    >
      <div
        className="rounded-2xl border px-5 py-3 text-center"
        style={{
          background: "oklch(0.18 0.024 260 / 0.88)",
          borderColor: "oklch(0.94 0.042 85 / 0.3)",
          backdropFilter: "blur(8px)",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          letterSpacing: "0.08em",
          color: "oklch(0.75 0.02 260)",
        }}
      >
        <span style={{ color: "oklch(0.94 0.042 85)" }}>👍 hold to advance</span>
        <span style={{ margin: "0 10px", opacity: 0.4 }}>·</span>
        <span style={{ color: "oklch(0.94 0.042 85)" }}>✋ hold to retry</span>
      </div>
    </div>
  );
}
