type Props = {
  gesture: "next" | "retry" | null;
  dwellProgress: number;
  displayState: "idle" | "result";
};

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

const chipPassiveIdle: React.CSSProperties = {
  opacity: 0.42,
};

export function GestureHint({ gesture, dwellProgress, displayState }: Props) {
  const isIdle = displayState === "idle";
  const nextActive = gesture === "next";
  const retryActive = gesture === "retry";
  const nextLabel = "Next";
  const retryLabel = "Retry";
  const chipStyle = (active: boolean): React.CSSProperties => ({
    ...chipBase,
    ...(isIdle && !active ? chipPassiveIdle : {}),
    ...(active ? chipActive : {}),
  });

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
      {/* Dwell cue — top edge, clear of playback controls and result feedback. */}
      {dwellProgress > 0 && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "oklch(0.94 0.042 85 / 0.16)",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.max(0, Math.min(1, dwellProgress)) * 100}%`,
              background: "oklch(0.94 0.042 85)",
              transition: "width 80ms linear",
            }}
          />
        </div>
      )}

      <div
        style={{
          position: "absolute",
          top: 14,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <div style={chipStyle(nextActive)}>
          <span>👍</span>
          <span>{nextLabel}</span>
        </div>
        <div style={chipStyle(retryActive)}>
          <span>✋</span>
          <span>{retryLabel}</span>
        </div>
      </div>
    </div>
  );
}
