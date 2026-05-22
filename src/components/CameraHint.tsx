import type { VocabItem } from "../data/vocab";
import type { HintKey } from "../model/signClassifier";

type Props = {
  item: VocabItem;
  hintKey: HintKey;
  passed: boolean;
};

const PARAM_LABEL: Record<HintKey, string> = {
  handshape:   "Handshape",
  movement:    "Movement",
  location:    "Location",
  orientation: "Orientation",
  framing:     "Framing",
};

export function CameraHint({ item, hintKey, passed }: Props) {
  if (passed) {
    // On a pass: show all correct parameters as a quiet reference panel
    return (
      <div className="absolute bottom-0 inset-x-0 pointer-events-none"
           style={{ padding: "0 12% 16px" }}>
        <div style={{
          background: "rgba(0,0,0,0.62)",
          backdropFilter: "blur(8px)",
          borderRadius: 14,
          padding: "12px 16px",
        }}>
          <p style={{ color: "rgba(74,222,128,0.9)", fontSize: 11, fontWeight: 700,
                      letterSpacing: "0.08em", marginBottom: 8 }}>
            CORRECT ✓
          </p>
          {(["handshape", "movement", "location", "orientation"] as HintKey[]).map(k => (
            <div key={k} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, width: 68, flexShrink: 0 }}>
                {PARAM_LABEL[k]}
              </span>
              <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 11 }}>
                {item.params[k as keyof typeof item.params]}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // On a fail: surface the specific failed parameter + hint, large and readable
  const paramValue = hintKey in item.params
    ? item.params[hintKey as keyof typeof item.params]
    : null;

  return (
    <div className="absolute bottom-0 inset-x-0 pointer-events-none"
         style={{ padding: "0 8% 16px" }}>
      <div style={{
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(10px)",
        borderRadius: 16,
        padding: "14px 18px",
        borderLeft: "3px solid rgba(248,113,113,0.8)",
      }}>
        <p style={{ color: "rgba(248,113,113,0.9)", fontSize: 10, fontWeight: 700,
                    letterSpacing: "0.1em", marginBottom: 6 }}>
          {PARAM_LABEL[hintKey].toUpperCase()}
        </p>
        {paramValue && (
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, marginBottom: 6 }}>
            Should be: <span style={{ color: "rgba(255,255,255,0.85)" }}>{paramValue}</span>
          </p>
        )}
        <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 1.45 }}>
          {item.hints[hintKey]}
        </p>
      </div>
    </div>
  );
}
