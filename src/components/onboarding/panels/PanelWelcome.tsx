import { MoteField } from "../MoteField";

export function PanelWelcome() {
  return (
    <section className="ob-panel">
      <MoteField />
      <div className="ob-pad" style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div className="ob-micro" style={{ marginBottom: 28 }}>
          <span style={{ color: "var(--accent)" }}>◍</span>&nbsp;&nbsp;ASL · 01 · A vocabulary tutor
        </div>
        <h1 className="ob-h-mega" style={{ maxWidth: "16ch" }}>
          Stokoe<span className="ob-it">.</span>
        </h1>
        <p className="ob-lede" style={{ marginTop: 40 }}>
          Learn American Sign Language by signing it. Prompt, sign,
          and receive structured feedback on what your hands actually did —
          handshape, movement, location.
        </p>
        <div style={{ marginTop: 64, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--fg-faint)", letterSpacing: "0.14em", textTransform: "uppercase", maxWidth: 520, lineHeight: 1.7 }}>
          Named for <span style={{ color: "var(--fg-mute)" }}>William&nbsp;Stokoe&nbsp;(1919–2000)</span>,&nbsp;
          who proved ASL is a natural language with its own phonology.
        </div>
      </div>
    </section>
  );
}
