import { useCallback, useEffect, useState } from "react";
import "./onboarding.css";
import { Carousel } from "./Carousel";
import { PanelWelcome } from "./panels/PanelWelcome";
import { PanelParameters } from "./panels/PanelParameters";
import { PanelFeedback } from "./panels/PanelFeedback";
import { PanelPermission } from "./panels/PanelPermission";
import { PanelFraming } from "./panels/PanelFraming";
import { PanelBegin } from "./panels/PanelBegin";

type Props = {
  onComplete: () => void;
};

const COUNT = 6;

export function Onboarding({ onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [framingReady, setFramingReady] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [handoff, setHandoff] = useState(false);

  const requestCamera = useCallback(async () => {
    setCamError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "user" },
        audio: false,
      });
      setStream(s);
    } catch (e: unknown) {
      const err = e as { name?: string };
      setCamError(err.name === "NotAllowedError" ? "Permission denied" : "Camera unavailable");
    }
  }, []);

  const closeCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setFramingReady(false);
  }, [stream]);

  useEffect(() => {
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, [stream]);

  const handleBegin = useCallback(() => {
    setExiting(true);
    setTimeout(() => setHandoff(true), 600);
    setTimeout(() => {
      stream?.getTracks().forEach((t) => t.stop());
      onComplete();
    }, 1800);
  }, [stream, onComplete]);

  // Gating: cannot advance past permission without stream, cannot advance past framing without ready
  const gatedSetIndex = useCallback((updater: (i: number) => number) => {
    setIndex((current) => {
      const next = updater(current);
      if (next > current) {
        if (current === 3 && !stream) return current;
        if (current === 4 && !framingReady) return current;
      }
      return Math.max(0, Math.min(COUNT - 1, next));
    });
  }, [stream, framingReady]);

  const carouselLocked = index === COUNT - 1;
  const canBack = index > 0 && !exiting;
  const canFwd = index < COUNT - 1 && !exiting
    && !(index === 3 && !stream)
    && !(index === 4 && !framingReady);

  const pips = Array.from({ length: COUNT }, (_, i) => (
    <span key={i} className={`ob-pip${i === index ? " on" : ""}`} />
  ));

  return (
    <div className="ob-root">
      <Carousel
        index={index}
        setIndex={gatedSetIndex}
        count={COUNT}
        locked={carouselLocked}
        exiting={exiting}
      >
        <PanelWelcome />
        <PanelParameters />
        <PanelFeedback />
        <PanelPermission
          stream={stream}
          onAllow={requestCamera}
          onClose={closeCamera}
          error={camError}
        />
        <PanelFraming
          stream={stream}
          active={index === 4}
          onReady={() => setFramingReady(true)}
          ready={framingReady}
        />
        <PanelBegin onCommit={handleBegin} />
      </Carousel>

      {/* Top chrome */}
      <div className="ob-chrome">
        <div className="ob-crest">
          <span className="ob-crest-dot" />
          <span>Stokoe</span>
        </div>
        <div className="ob-steps">
          <span style={{ color: "var(--fg)" }}>{String(index + 1).padStart(2, "0")}</span>
          &nbsp;<span style={{ color: "var(--fg-faint)" }}>/ {String(COUNT).padStart(2, "0")}</span>
          &nbsp;&nbsp;&nbsp;{pips}
        </div>
      </div>

      {/* Lightline */}
      <div className="ob-lightline" aria-hidden="true">
        <div className="ob-lightline-fill" style={{ width: `${(index / (COUNT - 1)) * 100}%` }} />
        <div className="ob-lightline-head" style={{ left: `${(index / (COUNT - 1)) * 100}%` }} />
      </div>

      {/* Bottom hint */}
      <div className="ob-hint">
        <span>
          {index === COUNT - 1 ? "Drag the knob to begin" : "Drag · arrows · scroll →"}
        </span>
        <div className="ob-navhint">
          <button
            className="ob-navbtn"
            data-no-drag
            disabled={!canBack}
            onClick={() => gatedSetIndex((i) => i - 1)}
            aria-label="Previous"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M19 12 L5 12 M11 6 L5 12 L11 18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
            </svg>
          </button>
          <button
            className="ob-navbtn"
            data-no-drag
            disabled={!canFwd}
            onClick={() => gatedSetIndex((i) => i + 1)}
            aria-label="Next"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12 L19 12 M13 6 L19 12 L13 18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
            </svg>
          </button>
        </div>
      </div>

      {/* Handoff splash */}
      <div className={`ob-handoff${handoff ? " in" : ""}`}>
        <div className="ob-micro" style={{ marginBottom: 8 }}>Session 01 · 10 signs queued</div>
        <div className="ob-handoff-ready">
          Begin <span className="ob-it">signing.</span>
        </div>
      </div>
    </div>
  );
}
