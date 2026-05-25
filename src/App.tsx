import { useCallback, useRef, useState } from "react";
import { useHandSwipe } from "./hooks/useHandSwipe";
import { useGestureNav } from "./hooks/useGestureNav";
import { GestureHint } from "./components/GestureHint";
import { VOCAB } from "./data/vocab";
import type { VocabItem } from "./data/vocab";
import { NOTATION } from "./data/notation";
import { classifyAttempt } from "./model/signClassifier";
import type { HintKey } from "./model/signClassifier";
import { getProfile, saveProfile, markTutorialDone, getProgress, recordAttempt } from "./store/progress";
import type { Progress, UserProfile } from "./store/progress";
import { WebcamView } from "./components/WebcamView";
import { SignPrompt } from "./components/SignPrompt";
import { FeedbackPanel } from "./components/FeedbackPanel";
import { SignVideo } from "./components/SignVideo";
import { WordPicker } from "./components/WordPicker";
import { LoginScreen } from "./components/LoginScreen";
import { WelcomeSplash } from "./components/WelcomeSplash";
import { Onboarding } from "./components/onboarding/Onboarding";
import { CameraHint } from "./components/CameraHint";
import { MoteField } from "./components/onboarding/MoteField";
import { RecordingReview } from "./components/RecordingReview";

type SessionState = "idle" | "recording" | "evaluating" | "result";
type AppPhase = "login" | "login-exit" | "splash" | "app";

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

function PromptFocusOverlay({
  item,
  vocabIndex,
  vocabTotal,
  paused,
  started,
  onStart,
}: {
  item: VocabItem;
  vocabIndex: number;
  vocabTotal: number;
  paused: boolean;
  started: boolean;
  onStart: () => void;
}) {
  const notation = NOTATION[item.id];

  return (
    <div className="pointer-events-none absolute inset-x-4 top-1/2 z-30 flex -translate-y-1/2 justify-center">
      <div
        className="max-w-[440px] rounded-2xl border px-8 py-5 text-center shadow-2xl"
        style={{
          background: "oklch(0.18 0.024 260 / 0.72)",
          borderColor: "oklch(0.94 0.042 85 / 0.42)",
          backdropFilter: "blur(14px)",
          boxShadow: "0 18px 60px rgb(0 0 0 / 0.32), 0 0 34px oklch(0.94 0.042 85 / 0.16)",
        }}
      >
        <div className="mb-1 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.22em] text-slate-400">
          <span>Sign this word</span>
          <span className="text-slate-600">·</span>
          <span>{vocabIndex + 1} / {vocabTotal}</span>
        </div>
        {paused && (
          <div
            className="mb-2 inline-flex rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.22em]"
            style={{
              color: "oklch(0.94 0.042 85)",
              borderColor: "oklch(0.94 0.042 85 / 0.42)",
              background: "oklch(0.94 0.042 85 / 0.10)",
            }}
          >
            {started ? "Practice paused" : "Read first"}
          </div>
        )}
        <div
          className="text-5xl font-semibold leading-none text-slate-50"
          style={{ fontFamily: "'Newsreader', Georgia, serif" }}
        >
          {item.word}
        </div>
        {notation && (
          <div
            className="mt-2 text-lg tracking-[0.35em] text-slate-300"
            style={{ fontFamily: "StokoeTempo, monospace" }}
            title={notation.readable}
          >
            {notation.ascii}
          </div>
        )}
        {paused && (
          <button
            onClick={onStart}
            className="pointer-events-auto mt-5 rounded-xl border px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] transition-colors hover:brightness-110"
            style={{
              background: "oklch(0.94 0.042 85)",
              borderColor: "oklch(0.94 0.042 85)",
              color: "oklch(0.18 0.024 260)",
            }}
          >
            {started ? "Resume" : "Start"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => getProfile());
  const [appPhase, setAppPhase] = useState<AppPhase>(() => getProfile() ? "app" : "login");
  const [order] = useState<number[]>(() => shuffle(VOCAB.map((_, i) => i)));
  const [lessonOrder, setLessonOrder] = useState<number[] | null>(null);
  const [vocabIndex, setVocabIndex] = useState(0);
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [passed, setPassed] = useState<boolean | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [hintKey, setHintKey] = useState<HintKey | null>(null);
  const [progress, setProgress] = useState<Progress>(() => getProgress());
  const [swipeFlash, setSwipeFlash] = useState<"left" | "right" | null>(null);
  const [videoHidden, setVideoHidden] = useState(false);
  const [lastRecordingUrl, setLastRecordingUrl] = useState<string | null>(null);
  const [practicePaused, setPracticePaused] = useState(true);
  const [practiceStarted, setPracticeStarted] = useState(false);
  const [recordRequestId, setRecordRequestId] = useState(0);
  const [forceOnboarding, setForceOnboarding] = useState(
    () => new URLSearchParams(location.search).has("onboarding")
  );

  // Pointer-drag tracking for desktop mouse swipe fallback
  const pointerStartX = useRef<number | null>(null);

  const activeOrder = lessonOrder ?? order;
  const item = VOCAB[activeOrder[vocabIndex % activeOrder.length]];
  const showTutorial = profile ? !profile.tutorialDone || forceOnboarding : false;
  const showWordPicker = !!profile && !showTutorial && lessonOrder === null;

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
        setSessionState("result");
      } catch {
        setSessionState("idle");
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

  const resetPracticeState = useCallback(() => {
    setVocabIndex(0);
    setPassed(null);
    setConfidence(null);
    setHintKey(null);
    setSessionState("idle");
    setPracticePaused(true);
    setPracticeStarted(false);
    setRecordRequestId(0);
    setLastRecordingUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const handleStartLesson = useCallback((indices: number[]) => {
    if (indices.length === 0) return;
    setLessonOrder(indices);
    resetPracticeState();
  }, [resetPracticeState]);

  const handleDecideForMe = useCallback(() => {
    handleStartLesson(shuffle(VOCAB.map((_, index) => index)).slice(0, 10));
  }, [handleStartLesson]);

  const handleChangeLesson = useCallback(() => {
    setLessonOrder(null);
    resetPracticeState();
  }, [resetPracticeState]);

  const handleOnboardingRefresh = useCallback(() => {
    resetPracticeState();
    setForceOnboarding(false);
    window.setTimeout(() => setForceOnboarding(true), 0);
  }, [resetPracticeState]);

  const handlePracticePauseToggle = useCallback(() => {
    if (practicePaused) {
      setPracticeStarted(true);
      setPracticePaused(false);
      return;
    }
    if (sessionState === "recording") {
      setSessionState("idle");
    }
    setPracticePaused(true);
  }, [practicePaused, sessionState]);

  const handleRecordAttempt = useCallback(() => {
    if (!practiceStarted || practicePaused || sessionState !== "idle") return;
    setPassed(null);
    setConfidence(null);
    setHintKey(null);
    setSessionState("recording");
    setRecordRequestId((id) => id + 1);
  }, [practicePaused, practiceStarted, sessionState]);

  const handleNext = useCallback(() => {
    setVocabIndex((i) => i + 1);
    setPassed(null); setConfidence(null); setHintKey(null);
    setSessionState("idle");
  }, []);

  const handlePrev = useCallback(() => {
    setVocabIndex((i) => Math.max(0, i - 1));
    setPassed(null); setConfidence(null); setHintKey(null);
    setSessionState("idle");
  }, []);

  const handleRetry = useCallback(() => {
    setPassed(null); setConfidence(null); setHintKey(null);
    setSessionState("idle");
  }, []);

  // Show a brief directional flash, then execute the navigation.
  // Gives the learner clear confirmation their swipe registered before the UI changes.
  const flashThen = useCallback((dir: "left" | "right", action: () => void) => {
    setSwipeFlash(dir);
    setTimeout(() => { setSwipeFlash(null); action(); }, 300);
  }, []);

  const handleSwipeNext = useCallback(() => flashThen("right", handleNext), [flashThen, handleNext]);
  const handleSwipePrev = useCallback(() => flashThen("left", handlePrev), [flashThen, handlePrev]);

  const displayState: "idle" | "recording" | "evaluating" | "result" =
    sessionState === "idle" ? "idle" :
    sessionState === "recording" ? "recording" :
    sessionState === "evaluating" ? "evaluating" : "result";

  // Single swipe: right = next sign, left = previous sign
  useHandSwipe(videoRef, !showTutorial && !showWordPicker && !practicePaused && sessionState === "result", handleSwipeNext, handleSwipePrev);

  // Dwell gesture nav: thumbs-up = next, open-5 = retry (active only in result state)
  const { gesture, dwellProgress } = useGestureNav(
    videoRef,
    !showTutorial && !showWordPicker && !practicePaused && displayState === "result",
    handleNext,
    handleRetry,
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if (sessionState !== "result") return;
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

  const gestureHint = displayState === "result"
    ? <GestureHint gesture={gesture} dwellProgress={dwellProgress} />
    : null;
  const reviewVisible = !showTutorial && !showWordPicker && displayState === "result" && !!lastRecordingUrl;

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
              <img src="/logo.webp" alt="" className="h-14 w-14 rounded object-cover object-center" />
              <h1 className="text-base font-bold text-slate-100 tracking-tight">Stokoe</h1>
            </button>
            <span className="text-xs text-slate-400">ASL 1 practice</span>
          </div>
          <div className="flex items-center gap-3">
            {!showWordPicker && !showTutorial && (
              <>
                {practiceStarted && !practicePaused && (
                  <button
                    onClick={handlePracticePauseToggle}
                    className="text-xs text-slate-400 transition-colors px-2 py-1 rounded-md hover:bg-slate-800/70 hover:text-slate-200"
                  >
                    Pause
                  </button>
                )}
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
        ) : showWordPicker ? (
          <main className="flex-1 min-h-0 overflow-hidden p-3">
            <WordPicker
              vocab={VOCAB}
              onStart={handleStartLesson}
              onDecideForMe={handleDecideForMe}
            />
          </main>
        ) : (
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3 p-3 min-h-0 overflow-hidden">
          <div className="flex flex-col gap-3 min-h-0">
            <SignPrompt
              record={progress[item.id]}
              sessionState={displayState}
              onRecord={handleRecordAttempt}
              onNext={handleNext}
              onRetry={handleRetry}
              passed={passed}
              vocabIndex={vocabIndex % activeOrder.length}
              vocabTotal={activeOrder.length}
              paused={practicePaused}
            />
            {/* Webcam + reference video side by side so learner can compare in real time */}
            <div className="relative flex-1 grid gap-3 min-h-0 grid-cols-2">
              <PromptFocusOverlay
                item={item}
                vocabIndex={vocabIndex % activeOrder.length}
                vocabTotal={activeOrder.length}
                paused={practicePaused}
                started={practiceStarted}
                onStart={handlePracticePauseToggle}
              />
              <div className="relative flex min-h-0">
                <div className={`flex min-h-0 flex-1 ${reviewVisible ? "pointer-events-none opacity-0" : ""}`}>
                  {showTutorial ? (
                    <section
                      className="flex-1 bg-slate-900/60 overflow-hidden relative min-h-0"
                      style={{ clipPath: "circle(50% at 50% 50%)", borderRadius: "50%" }}
                    />
                  ) : (
                    <WebcamView
                      videoRef={videoRef}
                      sessionState={displayState}
                      paused={practicePaused}
                      cameraEnabled={practiceStarted}
                      recordRequestId={recordRequestId}
                      onFramesReady={handleFramesReady}
                      onRecordingReady={handleRecordingReady}
                      overlay={
                        swipeFlash
                          ? <SwipeFlash direction={swipeFlash} />
                          : displayState === "result" && passed !== null
                          ? (
                            <>
                              <CameraHint item={item} hintKey={hintKey ?? "framing"} passed={passed} />
                              {gestureHint}
                            </>
                          )
                          : null
                      }
                    />
                  )}
                </div>
                {reviewVisible && lastRecordingUrl && (
                  <div className="absolute inset-0 flex">
                    <RecordingReview url={lastRecordingUrl} paused={practicePaused} overlay={gestureHint} />
                  </div>
                )}
              </div>
              <SignVideo
                item={item}
                hidden={videoHidden}
                paused={practicePaused}
                onToggleHidden={() => setVideoHidden((hidden) => !hidden)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-3 min-h-0 overflow-y-auto">
            <FeedbackPanel
              item={item}
              sessionState={displayState}
              passed={passed}
              hintKey={hintKey}
              confidence={confidence}
              progress={progress}
              paused={practicePaused}
            />
          </div>
        </main>
        )}
      </div>

      {showTutorial && <Onboarding onComplete={handleTutorialComplete} />}
    </div>
  );
}
