import { Aperture } from "../Aperture";

type Props = {
  stream: MediaStream | null;
  onAllow: () => void;
  onClose: () => void;
  error: string | null;
};

export function PanelPermission({ stream, onAllow, onClose, error }: Props) {
  const state = error ? "closed" : stream ? "opening" : "closed";
  return (
    <section className="ob-panel">
      <div className="ob-pad ob-grid ob-grid-2" style={{ height: "100%" }}>
        <div>
          <div className="ob-micro" style={{ marginBottom: 16 }}>Step 04 · Camera</div>
          <h2 className="ob-h-1" style={{ maxWidth: "14ch", marginBottom: 32 }}>
            Open <span className="ob-it">the lens.</span>
          </h2>
          <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 80, flexWrap: "wrap" }}>
            <button
              className="ob-pill"
              onClick={stream ? onClose : onAllow}
              data-no-drag
            >
              {stream ? "Close the lens" : "Open the lens"}
            </button>
            <span className="ob-micro" style={{ maxWidth: 240, textTransform: "uppercase" }}>
              {error
                ? <span style={{ color: "var(--accent)" }}>{error}</span>
                : stream ? "Lens open" : "Browser will ask permission"}
            </span>
          </div>
          <div className="ob-micro" style={{ marginBottom: 18 }}>Everything else</div>
          <ul className="ob-bullets">
            <li>Your progress is stored under your user profile.</li>
            <li>Frames are processed on this device.</li>
            <li>No recording.</li>
            <li>No upload.</li>
            <li>Derived state only — pass, fail, <span className="ob-glow-word">mastery</span>.</li>
          </ul>
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Aperture state={state} stream={stream} size={420} label={stream ? "LENS OPEN" : "LENS CLOSED"} />
        </div>
      </div>
    </section>
  );
}
