import { MoteField } from "../MoteField";

export function PanelWelcome() {
  return (
    <section className="ob-panel">
      <MoteField />
      <div className="ob-pad" style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div className="ob-micro" style={{ marginBottom: 28 }}>
          <span style={{ color: "var(--accent)" }}>◍</span>&nbsp;&nbsp;Vocabulary tutor
        </div>
        <h1 className="ob-h-mega" style={{ maxWidth: "16ch" }}>
          Stokoe<span className="ob-it">.</span>
        </h1>
        <div className="ob-lede" style={{ marginTop: 40 }}>
          <p style={{ margin: 0 }}>Learn American Sign Language.</p>
          <p style={{ margin: "8px 0 0" }}>Receive feedback on what your hands actually did.</p>
          <div className="ob-welcome-terms" aria-label="Handshape, movement, and location">
            <span>
              <strong>Handshape.</strong>
              <small>DEZ</small>
            </span>
            <span>
              <strong>Movement.</strong>
              <small>SIG</small>
            </span>
            <span>
              <strong>Location.</strong>
              <small>TAB</small>
            </span>
          </div>
        </div>
        <div style={{ marginTop: 64, fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color: "var(--fg-faint)", letterSpacing: "0.02em", maxWidth: 560, lineHeight: 1.75 }}>
          "Speech is sufficient for language, but not necessary." —{" "}
          <span style={{ color: "var(--fg-mute)" }}>William&nbsp;Stokoe</span>, American linguist who revolutionized understanding of{" "}
          <span style={{ color: "var(--fg-mute)" }}>ASL</span>.
        </div>
      </div>
    </section>
  );
}
