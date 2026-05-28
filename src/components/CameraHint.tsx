import type { KeyboardEvent, MouseEvent } from "react";
import type { VocabItem } from "../data/vocab";
import type { HintKey } from "../model/signClassifier";

type Props = {
  item: VocabItem;
  hintKey: HintKey;
  passed: boolean;
  tucked?: boolean;
  onToggleTucked?: () => void;
};

const PARAM_LABEL: Record<HintKey, string> = {
  handshape:   "Handshape",
  movement:    "Movement",
  location:    "Location",
  orientation: "Orientation",
  framing:     "Framing",
};

export function CameraHint({ item, hintKey, passed, tucked = false, onToggleTucked }: Props) {
  const positionClass = tucked
    ? "bottom-4 left-4 w-[min(280px,calc(100%-32px))]"
    : "inset-x-[8%] top-1/2 -translate-y-1/2";
  const containerClass = `absolute z-30 pointer-events-auto ${positionClass}`;
  const actionProps = {
    role: "button",
    tabIndex: 0,
    onClick: (event: MouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
      onToggleTucked?.();
    },
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      onToggleTucked?.();
    },
    "aria-label": tucked ? "Expand feedback" : "Tuck feedback",
  };

  if (passed) {
    // On a pass: show all correct parameters as a quiet reference panel
    return (
      <div className={containerClass} {...actionProps}>
        <div style={{
          background: "rgba(0,0,0,0.62)",
          backdropFilter: "blur(8px)",
          borderRadius: 14,
          padding: tucked ? "10px 12px" : "12px 16px",
          cursor: onToggleTucked ? "pointer" : "default",
        }}>
          <p style={{ color: "rgba(74,222,128,0.9)", fontSize: 11, fontWeight: 700,
                      letterSpacing: "0.08em", marginBottom: 8 }}>
            CORRECT ✓
          </p>
          {!tucked && (["handshape", "movement", "location", "orientation"] as HintKey[]).map(k => (
              <div key={k} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, width: 68, flexShrink: 0 }}>
                  {PARAM_LABEL[k]}
                </span>
                <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 11 }}>
                  {item.params[k as keyof typeof item.params]}
                </span>
              </div>
            ))}
          {tucked && (
            <p style={{ color: "rgba(255,255,255,0.78)", fontSize: 12 }}>
              Click to expand.
            </p>
          )}
        </div>
      </div>
    );
  }

  // On a fail: surface the specific failed parameter + hint, large and readable
  const paramValue = hintKey in item.params
    ? item.params[hintKey as keyof typeof item.params]
    : null;

  return (
    <div className={containerClass} {...actionProps}>
      <div style={{
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(10px)",
        borderRadius: 16,
        padding: tucked ? "10px 12px" : "14px 18px",
        borderLeft: "3px solid rgba(248,113,113,0.8)",
        cursor: onToggleTucked ? "pointer" : "default",
      }}>
        <p style={{ color: "rgba(248,113,113,0.9)", fontSize: 10, fontWeight: 700,
                    letterSpacing: "0.1em", marginBottom: 6 }}>
          {PARAM_LABEL[hintKey].toUpperCase()}
        </p>
        {!tucked && paramValue && (
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, marginBottom: 6 }}>
            Should be: <span style={{ color: "rgba(255,255,255,0.85)" }}>{paramValue}</span>
          </p>
        )}
        <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 1.45 }}>
          {tucked ? "Tap to expand feedback." : item.hints[hintKey]}
        </p>
      </div>
    </div>
  );
}
