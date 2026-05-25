import { SignPrimitive } from "../SignPrimitive";

const dims = [
  { code: "TAB", name: "Where", v: 0.92, ok: true },
  { code: "DEZ", name: "Shape", v: 0.88, ok: true },
  { code: "SIG", name: "Move",  v: 0.48, ok: false },
];

export function PanelFeedback() {
  return (
    <section className="ob-panel">
      <div className="ob-pad" style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div className="ob-micro" style={{ marginBottom: 34 }}>Preview · Reference and answer</div>
        <div className="ob-feedback-layout">
          <div className="ob-practice-preview" data-no-drag>
            <div className="ob-preview-head">
              <div className="ob-wordcard ob-wordcard-compact">
                <div className="ob-wordcard-lbl">Prompt</div>
                <div className="ob-wordcard-word">FAMILY</div>
              </div>
              <div className="ob-verdict-card">
                <span className="ob-verdict-label">Verdict</span>
                <div className="ob-verdict ob-verdict-compact">
                  <span className="ob-verdict-pulse" /> NOT QUITE
                </div>
              </div>
            </div>

            <div className="ob-video-pair">
              <div className="ob-mini-video">
                <div className="ob-mini-video-label">Reference</div>
                <div className="ob-mini-video-figure">
                  <SignPrimitive kind="move" />
                </div>
                <div className="ob-mini-video-chip">Smooth arc</div>
              </div>
              <div className="ob-mini-video ob-mini-video-muted">
                <div className="ob-mini-video-label">Your attempt</div>
                <div className="ob-attempt-figure" aria-hidden="true">
                  <span className="ob-attempt-dot one" />
                  <span className="ob-attempt-dot two" />
                  <span className="ob-attempt-dot three" />
                  <span className="ob-attempt-path" />
                </div>
                <div className="ob-mini-video-chip">Too quick</div>
              </div>
            </div>
          </div>

          <div className="ob-feedback-copy">
            <div>
              <div className="ob-micro">Answer</div>
              <div className="ob-h-1 ob-it" style={{ marginTop: 18, maxWidth: "14ch", color: "var(--fg)" }}>
                Smooth the rotation.
              </div>
              <p className="ob-lede" style={{ marginTop: 20 }}>
                The location and handshape read clearly. The movement needs a fuller, slower arc.
              </p>
            </div>

            <div className="ob-diag ob-diag-large">
              {dims.map((d) => (
                <div className="ob-diag-row" key={d.name}>
                  <div className="ob-diag-name">
                    <span>{d.code}</span>
                    <strong>{d.name}</strong>
                  </div>
                  <div className={`ob-meter${d.ok ? "" : " miss"}`}>
                    <div className="ob-meter-fill" style={{ width: `${d.v * 100}%` }} />
                  </div>
                  <div className="ob-pct">{Math.round(d.v * 100)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
