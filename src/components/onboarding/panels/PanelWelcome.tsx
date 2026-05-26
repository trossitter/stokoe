import { MoteField } from "../MoteField";

export function PanelWelcome() {
  return (
    <section className="ob-panel">
      <MoteField />
      <div className="ob-pad ob-welcome-pad">
        <div className="ob-micro" style={{ marginBottom: 28 }}>
          <span style={{ color: "var(--accent)" }}>◍</span>&nbsp;&nbsp;Vocabulary tutor
        </div>
        <h1 className="ob-h-mega">
          Stokoe<span className="ob-it">.</span>
        </h1>
        <div className="ob-lede" style={{ marginTop: 40 }}>
          <p style={{ margin: 0 }}>Learn American Sign Language.</p>
          <p style={{ margin: "8px 0 0" }}>Receive feedback on what your hands actually did.</p>
          <div className="ob-welcome-terms" aria-label="Location, handshape, and movement">
            <span>
              <strong>Location.</strong>
              <small>TAB</small>
            </span>
            <span>
              <strong>Handshape.</strong>
              <small>DEZ</small>
            </span>
            <span>
              <strong>Movement.</strong>
              <small>SIG</small>
            </span>
          </div>
        </div>
        <div className="ob-welcome-quote">
          "Speech is sufficient for language, but not necessary." —{" "}
          <span style={{ color: "var(--fg-mute)" }}>William&nbsp;Stokoe</span>, American linguist who revolutionized understanding of{" "}
          <span style={{ color: "var(--fg-mute)" }}>ASL</span>.
        </div>
      </div>
    </section>
  );
}
