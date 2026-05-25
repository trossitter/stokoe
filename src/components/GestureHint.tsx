type Props = {
  gesture: "next" | "retry" | null;
  dwellProgress: number;
};

const ARC_R = 46;
const CIRCUMFERENCE = 2 * Math.PI * ARC_R;

const chipBase: React.CSSProperties = {
  background: "rgba(0,0,0,0.5)",
  borderRadius: 20,
  padding: "6px 14px",
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontSize: 11,
  color: "rgba(255,255,255,0.7)",
  display: "flex",
  alignItems: "center",
  gap: 6,
  border: "1px solid transparent",
  userSelect: "none",
};

const chipActive: React.CSSProperties = {
  background: "oklch(0.94 0.042 85 / 0.25)",
  border: "1px solid oklch(0.94 0.042 85 / 0.5)",
  color: "oklch(0.94 0.042 85)",
};

export function GestureHint({ gesture, dwellProgress }: Props) {
  const dashOffset = CIRCUMFERENCE * (1 - dwellProgress);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
      {/* Dwell arc — covers the whole container */}
      {dwellProgress > 0 && (
        <svg
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <circle
            cx="50%"
            cy="50%"
            r={ARC_R}
            fill="none"
            stroke="oklch(0.94 0.042 85)"
            strokeWidth="3"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ transition: "stroke-dashoffset 80ms linear" }}
          />
        </svg>
      )}

      {/* Pill chips at bottom-center */}
      <div
        style={{
          position: "absolute",
          bottom: 18,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <div style={{ ...chipBase, ...(gesture === "next" ? chipActive : {}) }}>
          <span>👍</span>
          <span>Next</span>
        </div>
        <div style={{ ...chipBase, ...(gesture === "retry" ? chipActive : {}) }}>
          <span>✋</span>
          <span>Retry</span>
        </div>
      </div>
    </div>
  );
}
