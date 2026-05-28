import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHandSwipe } from "./hooks/useHandSwipe";
import { useGestureNav } from "./hooks/useGestureNav";
import { GestureHint } from "./components/GestureHint";
import { VOCAB } from "./data/vocab";
import type { VocabItem } from "./data/vocab";
import { classifyAttempt } from "./model/signClassifier";
import type { HintKey } from "./model/signClassifier";
import { getProfile, saveProfile, markTutorialDone, getProgress, recordAttempt } from "./store/progress";
import type { Progress, UserProfile } from "./store/progress";
import { WebcamView } from "./components/WebcamView";
import type { RecordingCueState } from "./components/WebcamView";
import { SignPrompt } from "./components/SignPrompt";
import { ProgressDrawer } from "./components/FeedbackPanel";
import { SignVideo } from "./components/SignVideo";
import { WordPicker } from "./components/WordPicker";
import { NotationLab } from "./components/NotationLab";
import { LoginScreen } from "./components/LoginScreen";
import { WelcomeSplash } from "./components/WelcomeSplash";
import { Onboarding } from "./components/onboarding/Onboarding";
import { CameraHint } from "./components/CameraHint";
import { MoteField } from "./components/onboarding/MoteField";
import { RecordingReview } from "./components/RecordingReview";
import { BonusRound } from "./components/BonusRound";
import { GestureTooltip } from "./components/GestureTooltip";

type SessionState = "idle" | "recording" | "evaluating" | "result";
type AppPhase = "login" | "login-exit" | "splash" | "app" | "bonus";
type AppView = "practice" | "notation" | "bonus";
type GestureConfirmation = "Skip" | "Next" | "Record" | "Retry";

const BONUS_TRANSITION_DELAY_MS = 1600;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Brief directional flash shown when a hand swipe registers — confirms the gesture fired
function SwipeFlash({ direction }: { direction: "left" | "right" }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
         style={{ zIndex: 10 }}>
      <div style={{
        background: "rgba(255,255,255,0.18)",
        border: "2px solid rgba(255,255,255,0.5)",
        borderRadius: "50%",
        width: 88, height: 88,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 40, color: "#fff",
        animation: "swipe-flash 0.32s ease-out forwards",
      }}>
        {direction === "right" ? "→" : "←"}
      </div>
    </div>
  );
}

function GestureActionFlash({ label }: { label: GestureConfirmation }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center rounded-[28px] pointer-events-none"
      style={{
        zIndex: 45,
        background: "oklch(0.12 0.02 260 / 0.58)",
        backdropFilter: "blur(4px)",
        boxShadow: "inset 0 0 0 1px oklch(0.94 0.042 85 / 0.28)",
      }}
    >
      <div
        className="rounded-2xl border px-8 py-5 text-center shadow-2xl"
        style={{
          background: "oklch(0.18 0.024 260 / 0.72)",
          borderColor: "oklch(0.94 0.042 85 / 0.38)",
        }}
      >
        <div
          className="mb-2 text-[10px] uppercase tracking-[0.22em]"
          style={{
            color: "oklch(0.94 0.042 85 / 0.72)",
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          }}
        >
          Gesture accepted
        </div>
        <div
          className="text-5xl leading-none text-slate-50"
          style={{ fontFamily: "'Newsreader', Georgia, serif" }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

function PromptFocusOverlay({
  item,
  paused,
  sessionState,
  docked,
  hasAttempt,
  onDockToggle,
  onStart,
  onSkip,
  onRetry,
}: {
  item: VocabItem;
  paused: boolean;
  sessionState: SessionState;
  docked: boolean;
  hasAttempt: boolean;
  onDockToggle: () => void;
  onStart: () => void;
  onSkip: () => void;
  onRetry: () => void;
}) {
  const hiddenWhileSigning = sessionState === "recording" || sessionState === "evaluating";

  if (hiddenWhileSigning) {
    return null;
  }

  return (
    <div
      className={`pointer-events-none absolute inset-x-3 z-30 flex justify-center transition-all duration-500 ease-out ${
        docked ? "top-3" : "top-1/2 -translate-y-1/2"
      } scale-100 opacity-100`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onDockToggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onDockToggle();
          }
        }}
        className={`border text-center shadow-xl outline-none transition-all duration-500 ease-out focus-visible:ring-2 focus-visible:ring-[oklch(0.94_0.042_85)] ${
          "pointer-events-auto cursor-pointer"
        } ${
          docked
            ? "max-w-[520px] rounded-xl px-4 py-2"
            : "max-w-[360px] rounded-2xl px-6 py-4"
        }`}
        style={{
          background: docked ? "oklch(0.18 0.024 260 / 0.46)" : "oklch(0.18 0.024 260 / 0.66)",
          borderColor: docked ? "oklch(0.94 0.042 85 / 0.22)" : "oklch(0.94 0.042 85 / 0.34)",
          backdropFilter: "blur(10px)",
          boxShadow: docked
            ? "0 8px 24px rgb(0 0 0 / 0.20)"
            : "0 16px 44px rgb(0 0 0 / 0.28), 0 0 28px oklch(0.94 0.042 85 / 0.12)",
        }}
      >
        {docked ? (
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span
              className="text-xl font-semibold leading-none text-slate-50"
              style={{ fontFamily: "'Newsreader', Georgia, serif" }}
            >
              {item.word}
            </span>
            {paused && (
              <div className="flex items-center gap-2">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    if (sessionState === "result") {
                      onRetry();
                      return;
                    }
                    onStart();
                  }}
                  className="rounded-md border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors hover:brightness-110"
                  style={{
                    background: "oklch(0.94 0.042 85)",
                    borderColor: "oklch(0.94 0.042 85)",
                    color: "oklch(0.18 0.024 260)",
                  }}
                >
                  {hasAttempt ? "Record again" : "Start signing"}
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onSkip();
                  }}
                  className="rounded-md border border-slate-700 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-200 transition-colors hover:bg-slate-800/70"
                >
                  Skip
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div
              className="text-4xl font-semibold leading-none text-slate-50 sm:text-5xl"
              style={{ fontFamily: "'Newsreader', Georgia, serif" }}
            >
              {item.word}
            </div>
            {paused && (
              <div className="mt-4 flex justify-center gap-2">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    if (sessionState === "result") {
                      onRetry();
                      return;
                    }
                    onStart();
                  }}
                  className="rounded-lg border px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors hover:brightness-110"
                  style={{
                    background: "oklch(0.94 0.042 85)",
                    borderColor: "oklch(0.94 0.042 85)",
                    color: "oklch(0.18 0.024 260)",
                  }}
                >
                  {hasAttempt ? "Record again" : "Start signing"}
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onSkip();
                  }}
                  className="rounded-lg border border-slate-700 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200 transition-colors hover:bg-slate-800/70"
                >
                  Skip
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const searchParams = new URLSearchParams(location.search);
  const bonusPreview = import.meta.env.DEV && searchParams.has("bonus") && !!getProfile()?.tutorialDone;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => getProfile());
  const [appPhase, setAppPhase] = useState<AppPhase>(() => getProfile() ? (bonusPreview ? "bonus" : "app") : "login");
  const [activeView, setActiveView] = useState<AppView>("practice");
  const [order] = useState<number[]>(() => shuffle(VOCAB.map((_, i) => i)));
  const [lessonOrder, setLessonOrder] = useState<number[] | null>(null);
  const [vocabIndex, setVocabIndex] = useState(0);
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [passed, setPassed] = useState<boolean | null>(null);
  const [, setConfidence] = useState<number | null>(null);
  const [hintKey, setHintKey] = useState<HintKey | null>(null);
  const [progress, setProgress] = useState<Progress>(() => getProgress());
  const [swipeFlash, setSwipeFlash] = useState<"left" | "right" | null>(null);
  const [videoHidden, setVideoHidden] = useState(true);
  const [userVideoHidden, setUserVideoHidden] = useState(false);
  const [lastRecordingUrl, setLastRecordingUrl] = useState<string | null>(null);
  const [practicePaused, setPracticePaused] = useState(true);
  const [practiceStarted, setPracticeStarted] = useState(false);
  const [promptDocked, setPromptDocked] = useState(false);
  const [gestureConfirmation, setGestureConfirmation] = useState<GestureConfirmation | null>(null);
  const [recordRequestId, setRecordRequestId] = useState(0);
  const [bonusVocab, setBonusVocab] = useState<VocabItem[]>(() => bonusPreview ? VOCAB.slice(0, 5) : []);
  const [lastRecordingFrames, setLastRecordingFrames] = useState<string[]>([]);
  const [recordingIssue, setRecordingIssue] = useState(false);
  const [recordingCueState, setRecordingCueState] = useState<RecordingCueState>("idle");
  const [feedbackTucked, setFeedbackTucked] = useState(false);
  const [bonusCelebrating, setBonusCelebrating] = useState(false);
  const [forceOnboarding, setForceOnboarding] = useState(
    () => searchParams.has("onboarding")
  );

  // Pointer-drag tracking for desktop mouse swipe fallback
  const pointerStartX = useRef<number | null>(null);
  const gestureConfirmationTimerRef = useRef<number | null>(null);
  const bonusTransitionTimerRef = useRef<number | null>(null);

  const activeOrder = lessonOrder ?? order;
  const item = VOCAB[activeOrder[vocabIndex % activeOrder.length]];
  const showTutorial = profile ? !profile.tutorialDone || forceOnboarding : false;
  const notationAvailable = !!profile?.tutorialDone && !showTutorial;
  const currentView: AppView = notationAvailable ? activeView : "practice";
  const showNotationLab = notationAvailable && currentView === "notation";
  const showBonusLab = notationAvailable && currentView === "bonus";
  const showWordPicker = !!profile && !showTutorial && currentView === "practice" && lessonOrder === null;
  const tabBonusVocab = useMemo(() => {
    if (bonusVocab.length > 0) return bonusVocab;
    return activeOrder
      .map((index) => VOCAB[index])
      .filter((entry): entry is VocabItem => !!entry);
  }, [activeOrder, bonusVocab]);

  const handleLogin = (name: string, powerUser: boolean) => {
    const saved = saveProfile(name, powerUser);
    setProfile(saved);
    if (powerUser) {
      // Fade out login, then show splash
      setAppPhase("login-exit");
      setTimeout(() => setAppPhase("splash"), 450);
    } else {
      // Fade out login, then show onboarding
      setAppPhase("login-exit");
      setTimeout(() => setAppPhase("app"), 450);
    }
  };

  const handleSplashDone = () => {
    setAppPhase("app");
  };

  const handleTutorialComplete = useCallback(() => {
    if (!profile) return;
    setProfile(markTutorialDone(profile));
    setForceOnboarding(false);
  }, [profile]);

  const handleFramesReady = useCallback(
    async (frames: ImageData[]) => {
      if (frames.length === 0) {
        setRecordingIssue(true);
        setSessionState("idle");
        return;
      }
      setSessionState("evaluating");
      try {
        const result = await classifyAttempt(frames, item.id);
        const updated = recordAttempt(item.id, result.passed);
        setPassed(result.passed);
        setConfidence(result.confidence);
        setHintKey(result.hintKey);
        setProgress(updated);
        setRecordingIssue(false);
        setFeedbackTucked(false);
        setSessionState("result");
      } catch {
        const updated = recordAttempt(item.id, false);
        setPassed(false);
        setConfidence(0);
        setHintKey("framing");
        setProgress(updated);
        setRecordingIssue(false);
        setFeedbackTucked(false);
        setSessionState("result");
      }
    },
    [item.id],
  );

  const handleRecordingReady = useCallback((url: string) => {
    setLastRecordingUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }, []);

  const handleRecordingFramesReady = useCallback((frames: string[]) => {
    setLastRecordingFrames(frames);
    setLastRecordingUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const clearLastRecording = useCallback(() => {
    setLastRecordingFrames([]);
    setLastRecordingUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const clearBonusTransition = useCallback(() => {
    if (bonusTransitionTimerRef.current) {
      window.clearTimeout(bonusTransitionTimerRef.current);
      bonusTransitionTimerRef.current = null;
    }
  }, []);

  const resetPracticeState = useCallback(() => {
    clearBonusTransition();
    setVocabIndex(0);
    setPassed(null);
    setConfidence(null);
    setHintKey(null);
    setSessionState("idle");
    setPracticePaused(true);
    setPracticeStarted(false);
    setPromptDocked(false);
    setFeedbackTucked(false);
    setVideoHidden(true);
    setGestureConfirmation(null);
    setRecordingIssue(false);
    if (gestureConfirmationTimerRef.current) {
      window.clearTimeout(gestureConfirmationTimerRef.current);
      gestureConfirmationTimerRef.current = null;
    }
    setRecordRequestId(0);
    clearLastRecording();
  }, [clearBonusTransition, clearLastRecording]);

  const showGestureConfirmation = useCallback((label: GestureConfirmation) => {
    if (gestureConfirmationTimerRef.current) {
      window.clearTimeout(gestureConfirmationTimerRef.current);
    }
    setGestureConfirmation(label);
    gestureConfirmationTimerRef.current = window.setTimeout(() => {
      setGestureConfirmation(null);
      gestureConfirmationTimerRef.current = null;
    }, 1100);
  }, []);

  useEffect(() => () => {
    if (gestureConfirmationTimerRef.current) {
      window.clearTimeout(gestureConfirmationTimerRef.current);
    }
    if (bonusTransitionTimerRef.current) {
      window.clearTimeout(bonusTransitionTimerRef.current);
    }
  }, []);

  const handleStartLesson = useCallback((indices: number[]) => {
    if (indices.length === 0) return;
    setAppPhase("app");
    setBonusCelebrating(false);
    setLessonOrder(indices);
    resetPracticeState();
  }, [resetPracticeState]);

  const handlePracticeSignFromNotation = useCallback((id: string) => {
    const index = VOCAB.findIndex((entry) => entry.id === id);
    if (index === -1) return;

    setAppPhase("app");
    setActiveView("practice");
    setBonusVocab([]);
    setBonusCelebrating(false);
    setLessonOrder([index]);
    resetPracticeState();
  }, [resetPracticeState]);

  const handleChangeLesson = useCallback(() => {
    setAppPhase("app");
    setActiveView("practice");
    setLessonOrder(null);
    setBonusVocab([]);
    setBonusCelebrating(false);
    resetPracticeState();
  }, [resetPracticeState]);

  const handleBonusExit = useCallback(() => {
    handleChangeLesson();
  }, [handleChangeLesson]);

  const handleOnboardingRefresh = useCallback(() => {
    setActiveView("practice");
    resetPracticeState();
    setForceOnboarding(false);
    window.setTimeout(() => setForceOnboarding(true), 0);
  }, [resetPracticeState]);

  const handleOpenPractice = useCallback(() => {
    clearBonusTransition();
    setActiveView("practice");
  }, [clearBonusTransition]);

  const handleOpenNotation = useCallback(() => {
    clearBonusTransition();
    setActiveView("notation");
    setPracticePaused(true);
  }, [clearBonusTransition]);

  const handleOpenBonus = useCallback(() => {
    const sessionItems = activeOrder
      .map((index) => VOCAB[index])
      .filter((entry): entry is VocabItem => !!entry);

    clearBonusTransition();
    setBonusVocab(sessionItems);
    setBonusCelebrating(false);
    setActiveView("bonus");
    setPracticePaused(true);
  }, [activeOrder, clearBonusTransition]);

  const beginRecordingAttempt = useCallback(() => {
    clearBonusTransition();
    clearLastRecording();
    setPassed(null);
    setConfidence(null);
    setHintKey(null);
    setRecordingIssue(false);
    setRecordingCueState("idle");
    setFeedbackTucked(false);
    setSessionState("recording");
    setRecordRequestId((id) => id + 1);
  }, [clearBonusTransition, clearLastRecording]);

  const handlePracticePauseToggle = useCallback(() => {
    if (practicePaused) {
      setPracticeStarted(true);
      setPracticePaused(false);
      beginRecordingAttempt();
      return;
    }
    if (sessionState === "recording") {
      setSessionState("idle");
    }
    setPracticePaused(true);
  }, [beginRecordingAttempt, practicePaused, sessionState]);

  const handleRecordAttempt = useCallback(() => {
    if (!practiceStarted || practicePaused || sessionState !== "idle") return;
    beginRecordingAttempt();
  }, [beginRecordingAttempt, practicePaused, practiceStarted, sessionState]);

  const startBonusRound = useCallback(() => {
    const sessionIndices = lessonOrder ?? activeOrder;
    const sessionItems = sessionIndices
      .map((index) => VOCAB[index])
      .filter((entry): entry is VocabItem => !!entry);

    setBonusVocab(sessionItems);
    setBonusCelebrating(true);
    resetPracticeState();
    setPracticePaused(true);
    setAppPhase("bonus");
  }, [activeOrder, lessonOrder, resetPracticeState]);

  const scheduleBonusRound = useCallback(() => {
    if (bonusTransitionTimerRef.current) return;

    bonusTransitionTimerRef.current = window.setTimeout(() => {
      bonusTransitionTimerRef.current = null;
      startBonusRound();
    }, BONUS_TRANSITION_DELAY_MS);
  }, [startBonusRound]);

  const handleNext = useCallback(({ afterAttempt = false }: { afterAttempt?: boolean } = {}) => {
    const nextIndex = vocabIndex + 1;
    if (afterAttempt && lessonOrder && nextIndex >= activeOrder.length) {
      scheduleBonusRound();
      return;
    }

    clearBonusTransition();
    setVocabIndex(nextIndex);
    setPassed(null); setConfidence(null); setHintKey(null);
    setRecordingIssue(false);
    setRecordingCueState("idle");
    setFeedbackTucked(false);
    setVideoHidden(true);
    setSessionState("idle");
    clearLastRecording();
  }, [activeOrder.length, clearBonusTransition, clearLastRecording, lessonOrder, scheduleBonusRound, vocabIndex]);

  const handlePrev = useCallback(() => {
    clearBonusTransition();
    setVocabIndex((i) => Math.max(0, i - 1));
    setPassed(null); setConfidence(null); setHintKey(null);
    setRecordingIssue(false);
    setRecordingCueState("idle");
    setFeedbackTucked(false);
    setVideoHidden(true);
    setSessionState("idle");
    clearLastRecording();
  }, [clearBonusTransition, clearLastRecording]);

  const handleRetry = useCallback(() => {
    clearBonusTransition();
    setPassed(null); setConfidence(null); setHintKey(null);
    setRecordingIssue(false);
    setRecordingCueState("idle");
    setFeedbackTucked(false);
    setSessionState("idle");
  }, [clearBonusTransition]);

  const handleSkip = useCallback(() => {
    handleNext({ afterAttempt: true });
  }, [handleNext]);

  // Show a brief directional flash, then execute the navigation.
  // Gives the learner clear confirmation their swipe registered before the UI changes.
  const flashThen = useCallback((dir: "left" | "right", action: () => void) => {
    setSwipeFlash(dir);
    setTimeout(() => { setSwipeFlash(null); action(); }, 300);
  }, []);

  const handleSwipeNext = useCallback(() => flashThen("right", () => handleNext({ afterAttempt: true })), [flashThen, handleNext]);
  const handleSwipePrev = useCallback(() => flashThen("left", handlePrev), [flashThen, handlePrev]);

  const displayState: "idle" | "recording" | "evaluating" | "result" =
    sessionState === "idle" ? "idle" :
    sessionState === "recording" ? "recording" :
    sessionState === "evaluating" ? "evaluating" : "result";

  const handleGestureNext = useCallback(() => {
    if (displayState === "result") {
      showGestureConfirmation("Next");
      handleNext({ afterAttempt: true });
      return;
    }
    if (displayState === "idle") {
      showGestureConfirmation("Skip");
      handleSkip();
    }
  }, [displayState, handleNext, handleSkip, showGestureConfirmation]);

  const handleGestureRetry = useCallback(() => {
    if (displayState === "result") {
      showGestureConfirmation("Retry");
      handleRetry();
      return;
    }
    if (displayState === "idle") {
      showGestureConfirmation("Record");
      handleRecordAttempt();
    }
  }, [displayState, handleRecordAttempt, handleRetry, showGestureConfirmation]);

  // Single swipe: right = next sign, left = previous sign
  useHandSwipe(videoRef, currentView === "practice" && !showTutorial && !showWordPicker && !practicePaused && sessionState === "result", handleSwipeNext, handleSwipePrev);

  // Dwell gesture nav: thumbs-up = next, open-5 = retry/record.
  const { gesture, dwellProgress } = useGestureNav(
    videoRef,
    currentView === "practice" && !showTutorial && !showWordPicker && !practicePaused && (displayState === "result" || displayState === "idle"),
    handleGestureNext,
    handleGestureRetry,
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if (currentView !== "practice" || sessionState !== "result") return;
    pointerStartX.current = e.clientX;
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointerStartX.current === null) return;
    const delta = e.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (delta > 60) handleSwipeNext();
    else if (delta < -60) handleSwipePrev();
  };

  if (appPhase === "login" || appPhase === "login-exit") {
    return <LoginScreen onLogin={handleLogin} exiting={appPhase === "login-exit"} />;
  }

  if (appPhase === "splash" && profile) {
    return <WelcomeSplash name={profile.name} onDone={handleSplashDone} />;
  }

  // appPhase === "app" — profile must exist; if somehow not, fall back to login
  if (!profile) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (appPhase === "bonus") {
    return (
      <BonusRound
        sessionVocab={bonusVocab}
        allVocab={VOCAB}
        onExit={handleBonusExit}
        celebratory={bonusCelebrating}
      />
    );
  }

  const gestureHint = displayState === "result" || displayState === "idle"
    ? <GestureHint gesture={gesture} dwellProgress={dwellProgress} displayState={displayState} />
    : null;
  const gestureConfirmationOverlay = gestureConfirmation
    ? <GestureActionFlash label={gestureConfirmation} />
    : null;
  const reviewVisible = currentView === "practice" && !showTutorial && !showWordPicker && displayState === "result" && (!!lastRecordingUrl || lastRecordingFrames.length > 0);
  const resultFeedbackOverlay = displayState === "result" && passed !== null
    ? (
      <CameraHint
        item={item}
        hintKey={hintKey ?? "framing"}
        passed={passed}
        tucked={feedbackTucked}
        onToggleTucked={() => setFeedbackTucked((tucked) => !tucked)}
      />
    )
    : null;
  const practiceOverlay = swipeFlash
    ? <SwipeFlash direction={swipeFlash} />
    : (
      <>
        {!reviewVisible && resultFeedbackOverlay}
        {gestureHint}
        {gestureConfirmationOverlay}
      </>
  );
  const gestureTooltipVisible = displayState === "result" && !showTutorial && !showWordPicker;

  return (
    <div
      className="h-screen overflow-hidden relative select-none"
      style={{ background: "oklch(0.22 0.028 260)" }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <div className="app-mote-bg">
        <MoteField />
      </div>

      <div className="relative z-10 h-screen flex flex-col overflow-hidden">
        <header
          className="relative z-[60] px-5 py-3 border-b flex items-center justify-between shrink-0"
          style={{
            background: "rgba(20, 22, 35, 0.85)",
            backdropFilter: "blur(12px)",
            borderColor: "oklch(0.36 0.028 260 / 0.5)",
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={handleOnboardingRefresh}
              className="flex items-center gap-3 rounded-lg pr-2 transition-colors hover:bg-slate-800/60"
              aria-label="Restart onboarding"
            >
              <img src="/logo.svg" alt="" className="h-14 w-14 rounded object-contain" />
              <h1 className="text-base font-bold text-slate-100 tracking-tight">Stokoe</h1>
            </button>
            <span className="text-xs text-slate-400">ASL 1 practice</span>
            {notationAvailable && (
              <nav className="ml-2 flex rounded-lg border border-slate-700/70 bg-slate-950/20 p-1">
                <button
                  type="button"
                  onClick={handleOpenPractice}
                  className="rounded-md px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors"
                  style={{
                    background: currentView === "practice" ? "oklch(0.94 0.042 85 / 0.14)" : "transparent",
                    color: currentView === "practice" ? "oklch(0.94 0.042 85)" : "rgb(148 163 184)",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Practice
                </button>
                <button
                  type="button"
                  onClick={handleOpenNotation}
                  className="rounded-md px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors"
                  style={{
                    background: currentView === "notation" ? "oklch(0.94 0.042 85 / 0.14)" : "transparent",
                    color: currentView === "notation" ? "oklch(0.94 0.042 85)" : "rgb(148 163 184)",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Notation
                </button>
                <button
                  type="button"
                  onClick={handleOpenBonus}
                  className="rounded-md px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors"
                  style={{
                    background: currentView === "bonus" ? "oklch(0.94 0.042 85 / 0.14)" : "transparent",
                    color: currentView === "bonus" ? "oklch(0.94 0.042 85)" : "rgb(148 163 184)",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Learn
                </button>
              </nav>
            )}
          </div>
          <div className="flex items-center gap-3">
            {currentView === "practice" && !showWordPicker && !showTutorial && (
              <>
                <button
                  onClick={handleChangeLesson}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors px-2 py-1 rounded-md hover:bg-slate-800/70"
                >
                  Change set
                </button>
                <span className="text-xs text-slate-500">·</span>
              </>
            )}
            <span className="text-xs text-slate-400">{profile.name}</span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-slate-400">
              {Object.values(progress).reduce((s, r) => s + r.attempts, 0)} attempts
            </span>
          </div>
        </header>

        {showTutorial ? (
          <main className="flex-1 min-h-0 overflow-hidden p-3" aria-hidden="true" />
        ) : showNotationLab ? (
          <main className="flex-1 min-h-0 overflow-hidden p-3">
            <NotationLab vocab={VOCAB} onPracticeSign={handlePracticeSignFromNotation} />
          </main>
        ) : showBonusLab ? (
          <main className="flex-1 min-h-0 overflow-hidden p-3">
            <BonusRound
              sessionVocab={tabBonusVocab}
              allVocab={VOCAB}
              onExit={handleOpenPractice}
              embedded
            />
          </main>
        ) : showWordPicker ? (
          <main className="flex-1 min-h-0 overflow-hidden p-3">
            <WordPicker
              vocab={VOCAB}
              onStart={handleStartLesson}
            />
          </main>
        ) : (
        <main className="relative flex-1 p-3 min-h-0 overflow-hidden">
          <ProgressDrawer progress={progress} />
          <div className="flex h-full flex-col gap-3 min-h-0">
            <SignPrompt
              record={progress[item.id]}
              sessionState={displayState}
              onRecord={handleRecordAttempt}
              onNext={() => handleNext({ afterAttempt: true })}
              onSkip={handleSkip}
              onRetry={handleRetry}
              passed={passed}
              vocabIndex={vocabIndex % activeOrder.length}
              vocabTotal={activeOrder.length}
              paused={practicePaused}
              recordingIssue={recordingIssue}
              recordingCueState={recordingCueState}
            />
            {/* Signer + reference side by side, matching the onboarding preview order. */}
            <div className="relative flex-1 grid items-start gap-3 min-h-0 grid-cols-1 md:grid-cols-2">
              <PromptFocusOverlay
                item={item}
                paused={practicePaused}
                sessionState={displayState}
                docked={promptDocked}
                hasAttempt={!!lastRecordingUrl || lastRecordingFrames.length > 0}
                onDockToggle={() => setPromptDocked((docked) => !docked)}
                onStart={handlePracticePauseToggle}
                onSkip={handleSkip}
                onRetry={handleRetry}
              />
              <div className="flex min-w-0 flex-col gap-2">
                <div className="relative aspect-[4/3] w-full min-h-0">
                <div className={`absolute inset-0 flex ${reviewVisible ? "pointer-events-none opacity-0" : ""}`}>
                  {showTutorial ? (
                    <section
                      className="h-full w-full rounded-2xl bg-slate-900/60 overflow-hidden relative"
                    />
                  ) : (
                    <WebcamView
                      videoRef={videoRef}
                      sessionState={displayState}
                      paused={practicePaused}
                      cameraEnabled={practiceStarted}
                      hidden={userVideoHidden}
                      recordRequestId={recordRequestId}
                      onFramesReady={handleFramesReady}
                      onRecordingReady={handleRecordingReady}
                      onRecordingFramesReady={handleRecordingFramesReady}
                      onRecordingCueStateChange={setRecordingCueState}
                      onToggleHidden={() => setUserVideoHidden((hidden) => !hidden)}
                      overlay={practiceOverlay}
                    />
                  )}
                </div>
                {reviewVisible && (
                  <div className="absolute inset-0 flex">
                    <RecordingReview
                      url={lastRecordingUrl}
                      frames={lastRecordingFrames}
                      paused={practicePaused}
                      hidden={userVideoHidden}
                      onToggleHidden={() => setUserVideoHidden((hidden) => !hidden)}
                      overlay={
                        <>
                          {resultFeedbackOverlay}
                          {gestureHint}
                          {gestureConfirmationOverlay}
                        </>
                      }
                    />
                  </div>
                )}
                <GestureTooltip visible={gestureTooltipVisible} />
                </div>
              </div>
              <SignVideo
                item={item}
                hidden={videoHidden}
                paused={practicePaused}
                onToggleHidden={() => setVideoHidden((hidden) => !hidden)}
              />
            </div>
          </div>
        </main>
        )}
      </div>

      {showTutorial && <Onboarding onComplete={handleTutorialComplete} />}
    </div>
  );
}
