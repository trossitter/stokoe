import { useEffect, useState } from "react";
import { Aperture } from "../Aperture";

type Props = {
  stream: MediaStream | null;
  active: boolean;
  onAllow: () => void;
  onClose: () => void;
  error: string | null;
  onReady: () => void;
  ready: boolean;
};

const EMPTY_CHIPS = { lens: false, light: false, frame: false, hand: false };

export function PanelFraming({ stream, active, onAllow, onClose, error, onReady, ready }: Props) {
  const [chips, setChips] = useState(EMPTY_CHIPS);

  useEffect(() => {
    if (!active || !stream) return;
    const t0 = setTimeout(() => setChips(EMPTY_CHIPS), 0);
    const t1 = setTimeout(() => setChips((c) => ({ ...c, lens: true })), 250);
    const t2 = setTimeout(() => setChips((c) => ({ ...c, light: true })), 1100);
    const t3 = setTimeout(() => setChips((c) => ({ ...c, frame: true })), 1900);
    const t4 = setTimeout(() => setChips((c) => ({ ...c, hand: true })), 2900);
    return () => [t0, t1, t2, t3, t4].forEach(clearTimeout);
  }, [active, stream]);

  useEffect(() => {
    if (stream && chips.lens && chips.light && chips.frame && chips.hand) onReady();
  }, [chips, onReady, stream]);

  const apState = !stream || error ? "closed" : ready ? "open" : "opening";
  const visibleChips = stream ? chips : EMPTY_CHIPS;

  return (
    <section className="ob-panel">
      <div className="ob-pad ob-grid ob-grid-2" style={{ height: "100%" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Aperture state={apState} stream={stream} size={440} label={ready ? "READY" : stream ? "ACQUIRING" : "CAMERA"} />
        </div>
        <div>
          <div className="ob-micro" style={{ marginBottom: 16 }}>Step 05 · Framing</div>
          <h2 className="ob-h-1" style={{ maxWidth: "16ch", marginBottom: 28 }}>
            Hands in <span className="ob-it">the light.</span>
          </h2>
          <p className="ob-lede" style={{ maxWidth: "38ch" }}>
            Sit so your torso fills the camera view. Your hands should sign comfortably
            inside the circle. The system is checking conditions now.
          </p>
          <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 28, flexWrap: "wrap" }}>
            <button
              className="ob-pill"
              onClick={stream ? onClose : onAllow}
              data-no-drag
            >
              {stream ? "Pause camera" : "Allow camera"}
            </button>
            <span className="ob-micro" style={{ maxWidth: 240, textTransform: "uppercase" }}>
              {error
                ? <span style={{ color: "var(--accent)" }}>{error}</span>
                : stream ? "Camera active" : "Browser may ask permission"}
            </span>
          </div>
          <div className="ob-chips" data-no-drag>
            <span className={`ob-chip${visibleChips.lens ? " is-on" : ""}`}>
              <span className="ob-chip-ok" /> Camera
            </span>
            <span className={`ob-chip${visibleChips.light ? " is-on" : ""}`}>
              <span className="ob-chip-ok" /> Lighting
            </span>
            <span className={`ob-chip${visibleChips.frame ? " is-on" : ""}`}>
              <span className="ob-chip-ok" /> Framing
            </span>
            <span className={`ob-chip${visibleChips.hand ? " is-on" : ""}`}>
              <span className="ob-chip-ok" /> Hand acquired
            </span>
          </div>
          <div className="ob-micro" style={{ marginTop: 36 }}>
            {ready ? <span style={{ color: "var(--accent)" }}>Conditions met</span> : stream ? "Calibrating…" : "Waiting for camera"}
          </div>
        </div>
      </div>
    </section>
  );
}
