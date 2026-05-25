const dims = [
  { name: "Where", v: 0.92, ok: true },
  { name: "Shape", v: 0.88, ok: true },
  { name: "Move",  v: 0.48, ok: false },
];

export function PanelFeedback() {
  return (
    <section className="ob-panel">
      <div className="ob-pad" style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div className="ob-micro" style={{ marginBottom: 48 }}>Preview · A finished attempt</div>
        <div className="ob-grid ob-grid-2-r" style={{ alignItems: "start" }}>
          <div>
            <div className="ob-verdict">
              <span className="ob-verdict-pulse" /> NOT QUITE
            </div>
            <div className="ob-h-1 ob-it" style={{ marginTop: 32, maxWidth: "14ch", color: "var(--fg)" }}>
              Smooth the rotation.
            </div>
            <p className="ob-lede" style={{ marginTop: 20 }}>
              The handshape and location read clearly. Your hands rotated too fast — try a fuller arc next time.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div className="ob-wordcard" data-no-drag>
              <div className="ob-wordcard-lbl">Prompt</div>
              <div className="ob-wordcard-word">FAMILY</div>
            </div>
            <div className="ob-diag" style={{ maxWidth: 380 }}>
              {dims.map((d) => (
                <div className="ob-diag-row" key={d.name}>
                  <div className="ob-diag-name">{d.name}</div>
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
