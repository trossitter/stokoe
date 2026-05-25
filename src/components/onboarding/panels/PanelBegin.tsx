import { MoteField } from "../MoteField";
import { SwipeTrack } from "../SwipeTrack";

type Props = {
  onCommit: () => void;
  active?: boolean;
};

export function PanelBegin({ onCommit, active = false }: Props) {
  return (
    <section className="ob-panel">
      <MoteField density={0.7} />
      <div className="ob-pad" style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start" }}>
        <h2 className="ob-h-mega" style={{ maxWidth: "16ch", marginBottom: 64 }}>
          Knowledge is <span className="ob-it">power.</span>
        </h2>
        <SwipeTrack onCommit={onCommit} active={active} label="Swipe to begin" finishedLabel="Beginning" />
        <div className="ob-micro" style={{ marginTop: 28 }}>
          Or press <span style={{ color: "var(--fg-mute)" }}>Space</span> · <span style={{ color: "var(--fg-mute)" }}>Enter</span> · <span style={{ color: "var(--fg-mute)" }}>Arrow</span>
        </div>
      </div>
    </section>
  );
}
