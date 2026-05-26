import { useCallback, useEffect, useRef, useState } from "react";
import "./onboarding.css";
import { Carousel } from "./Carousel";
import { PanelWelcome } from "./panels/PanelWelcome";
import { PanelParameters } from "./panels/PanelParameters";
import { PanelFeedback } from "./panels/PanelFeedback";
import { PanelPermission } from "./panels/PanelPermission";
import { PanelFraming } from "./panels/PanelFraming";
import { PanelBegin } from "./panels/PanelBegin";
import { useHandSwipe } from "../../hooks/useHandSwipe";

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

  // Hidden video element feeds the hand-swipe detector once camera is open
  const hiddenVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const vid = hiddenVideoRef.current;
    if (!vid) return;
    if (stream) {
      vid.srcObject = stream;
      vid.play().catch(() => {});
    } else {
      vid.srcObject = null;
    }
  }, [stream]);

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
    if (exiting) return;
    setExiting(true);
    setTimeout(() => setHandoff(true), 600);
    setTimeout(() => {
      stream?.getTracks().forEach((t) => t.stop());
      onComplete();
    }, 1800);
  }, [exiting, stream, onComplete]);

  const gatedSetIndex = useCallback((updater: (i: number) => number) => {
    setIndex((current) => Math.max(0, Math.min(COUNT - 1, updater(current))));
  }, []);

  // Hand-swipe navigation — active only once camera is open, disabled on final panel
  const swipeEnabled = !!stream && !exiting && index < COUNT - 1;
  useHandSwipe(
    hiddenVideoRef,
    swipeEnabled,
    () => gatedSetIndex((i) => i + 1),
    () => gatedSetIndex((i) => i - 1),
  );

  const carouselLocked = index === COUNT - 1;
  const canBack = index > 0 && !exiting;
  const canFwd = !exiting;
  const isFinalPanel = index === COUNT - 1;

  const hintText = isFinalPanel
    ? "Drag · slide · arrow → · Space"
    : stream
    ? "← swipe your hand · drag · arrows →"
    : "Drag · arrows →";

  const handleForward = useCallback(() => {
    if (isFinalPanel) {
      handleBegin();
      return;
    }
    gatedSetIndex((i) => i + 1);
  }, [gatedSetIndex, handleBegin, isFinalPanel]);

  const pips = Array.from({ length: COUNT }, (_, i) => (
    <span key={i} className={`ob-pip${i === index ? " on" : ""}`} />
  ));

  const handleRootClick = useCallback((e: React.MouseEvent) => {
    if (exiting) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, select, textarea")) return;
    if (e.clientX > window.innerWidth / 2) handleForward();
  }, [exiting, handleForward]);

  return (
    <div className="ob-root" onClick={handleRootClick}>
      {/* Hidden video — feeds MediaPipe hand swipe detection once stream is live */}
      <video ref={hiddenVideoRef} style={{ display: "none" }} muted playsInline />

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
        <PanelPermission />
        <PanelFraming
          stream={stream}
          active={index === 4}
          onAllow={requestCamera}
          onClose={closeCamera}
          error={camError}
          onReady={() => setFramingReady(true)}
          ready={framingReady}
        />
        <PanelBegin onCommit={handleBegin} active={index === 5} />
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

      {/* Bottom hint — updates once hand swipe is active */}
      <div className="ob-hint">
        <span>{hintText}</span>
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
            onClick={handleForward}
            aria-label={isFinalPanel ? "Begin" : "Next"}
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
