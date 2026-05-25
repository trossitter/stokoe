import { useEffect, useState } from "react";
import { Aperture } from "../Aperture";

type Props = {
  stream: MediaStream | null;
  active: boolean;
  onReady: () => void;
  ready: boolean;
};

export function PanelFraming({ stream, active, onReady, ready }: Props) {
  const [chips, setChips] = useState({ lens: false, light: false, frame: false, hand: false });

  useEffect(() => {
    if (!active || !stream) return;
    const t1 = setTimeout(() => setChips((c) => ({ ...c, lens: true })), 250);
    const t2 = setTimeout(() => setChips((c) => ({ ...c, light: true })), 1100);
    const t3 = setTimeout(() => setChips((c) => ({ ...c, frame: true })), 1900);
    const t4 = setTimeout(() => setChips((c) => ({ ...c, hand: true })), 2900);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [active, stream]);

  useEffect(() => {
    if (chips.lens && chips.light && chips.frame && chips.hand) onReady();
  }, [chips, onReady]);

  const apState = !stream ? "closed" : ready ? "open" : "opening";

  return (
    <section className="ob-panel">
      <div className="ob-pad ob-grid ob-grid-2" style={{ height: "100%" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Aperture state={apState} stream={stream} size={440} label={ready ? "READY" : "ACQUIRING"} />
        </div>
        <div>
          <div className="ob-micro" style={{ marginBottom: 16 }}>Step 05 · Framing</div>
          <h2 className="ob-h-1" style={{ maxWidth: "16ch", marginBottom: 28 }}>
            Hands in <span className="ob-it">the light.</span>
          </h2>
          <p className="ob-lede" style={{ maxWidth: "38ch" }}>
            Sit so your torso fills the lens. Your hands should sign comfortably
            inside the circle. The system is checking conditions now.
          </p>
          <div className="ob-chips" data-no-drag>
            <span className={`ob-chip${chips.lens ? " is-on" : ""}`}>
              <span className="ob-chip-ok" /> Lens
            </span>
            <span className={`ob-chip${chips.light ? " is-on" : ""}`}>
              <span className="ob-chip-ok" /> Lighting
            </span>
            <span className={`ob-chip${chips.frame ? " is-on" : ""}`}>
              <span className="ob-chip-ok" /> Framing
            </span>
            <span className={`ob-chip${chips.hand ? " is-on" : ""}`}>
              <span className="ob-chip-ok" /> Hand acquired
            </span>
          </div>
          <div className="ob-micro" style={{ marginTop: 36 }}>
            {ready ? <span style={{ color: "var(--accent)" }}>Conditions met</span> : "Calibrating…"}
          </div>
        </div>
      </div>
    </section>
  );
}
