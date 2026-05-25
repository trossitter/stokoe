import { useEffect, useRef } from "react";

export type ApertureState = "closed" | "opening" | "open" | "reviewing";

type Props = {
  state?: ApertureState;
  stream?: MediaStream | null;
  size?: number;
  label?: string;
};

const SCALE: Record<ApertureState, number> = {
  closed:    0.04,
  opening:   0.78,
  reviewing: 0.42,
  open:      1,
};

export function Aperture({ state = "closed", stream, size = 360, label }: Props) {
  const vidRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (vidRef.current && stream) {
      vidRef.current.srcObject = stream;
      vidRef.current.play?.().catch(() => {});
    }
  }, [stream]);

  const scale = SCALE[state];
  const haloOpacity = state === "closed" ? 0.5 : 1;

  return (
    <div className="ob-aperture" style={{ width: size, height: size }}>
      <div className="ob-ap-halo" style={{ opacity: haloOpacity }} />
      <div className="ob-ap-iris" style={{ transform: `scale(${scale})` }}>
        {stream
          ? <video ref={vidRef} muted autoPlay playsInline />
          : <div className="ob-ap-dark" />
        }
        <div className="ob-ap-mask" />
      </div>
      {state === "open" && <div className="ob-ap-pulse" />}
      {label && <div className="ob-ap-label">{label}</div>}
    </div>
  );
}
