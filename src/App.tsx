import { useCallback, useRef, useState } from "react";
import { useHandSwipe } from "./hooks/useHandSwipe";
import { VOCAB } from "./data/vocab";
import { classifyAttempt } from "./model/signClassifier";
import type { HintKey } from "./model/signClassifier";
import { getProfile, saveProfile, markTutorialDone, getProgress, recordAttempt } from "./store/progress";
import type { Progress, UserProfile } from "./store/progress";
import { WebcamView } from "./components/WebcamView";
import { SignPrompt } from "./components/SignPrompt";
import { FeedbackPanel } from "./components/FeedbackPanel";
import { LoginScreen } from "./components/LoginScreen";
import { WelcomeSplash } from "./components/WelcomeSplash";
import { Onboarding } from "./components/onboarding/Onboarding";
import { CameraHint } from "./components/CameraHint";

type SessionState = "idle" | "evaluating" | "result";
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

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => getProfile());
  const [appPhase, setAppPhase] = useState<AppPhase>(() => getProfile() ? "app" : "login");
  const [order] = useState<number[]>(() => shuffle(VOCAB.map((_, i) => i)));
  const [vocabIndex, setVocabIndex] = useState(0);
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [passed, setPassed] = useState<boolean | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [hintKey, setHintKey] = useState<HintKey | null>(null);
  const [progress, setProgress] = useState<Progress>(() => getProgress());
  const [swipeFlash, setSwipeFlash] = useState<"left" | "right" | null>(null);
  const [forceOnboarding, setForceOnboarding] = useState(
    () => new URLSearchParams(location.search).has("onboarding")
  );

  // Pointer-drag tracking for desktop mouse swipe fallback
  const pointerStartX = useRef<number | null>(null);

  const item = VOCAB[order[vocabIndex % VOCAB.length]];

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
      if (frames.length === 0) { setSessionState("idle"); return; }
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

  // Single swipe: right = next sign, left = previous sign
  useHandSwipe(videoRef, sessionState === "result", handleSwipeNext, handleSwipePrev);

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

  const showTutorial = !profile.tutorialDone || forceOnboarding;

  const displayState: "idle" | "recording" | "evaluating" | "result" =
    sessionState === "idle" ? "idle" :
    sessionState === "evaluating" ? "evaluating" : "result";

  return (
    <div
      className="h-screen flex flex-col bg-slate-50 overflow-hidden relative select-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <header className="px-5 py-3 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo.webp" alt="Stokoe" className="h-7 w-7 rounded" />
          <h1 className="text-base font-bold text-slate-900 tracking-tight">Stokoe</h1>
          <span className="text-xs text-slate-400">ASL 1 practice</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{profile.name}</span>
          <span className="text-xs text-slate-300">·</span>
          <span className="text-xs text-slate-400">
            {Object.values(progress).reduce((s, r) => s + r.attempts, 0)} attempts
          </span>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3 p-3 min-h-0 overflow-hidden">
        <div className="flex flex-col gap-3 min-h-0">
          <SignPrompt
            item={item}
            record={progress[item.id]}
            sessionState={displayState}
            onNext={handleNext}
            onRetry={handleRetry}
            passed={passed}
            vocabIndex={vocabIndex % VOCAB.length}
            vocabTotal={VOCAB.length}
          />
          <WebcamView
            videoRef={videoRef}
            sessionState={showTutorial ? "idle" : displayState}
            onFramesReady={handleFramesReady}
            overlay={
              swipeFlash
                ? <SwipeFlash direction={swipeFlash} />
                : displayState === "result" && passed !== null
                ? <CameraHint item={item} hintKey={hintKey ?? "framing"} passed={passed} />
                : null
            }
          />
        </div>
        <FeedbackPanel
          item={item}
          sessionState={displayState}
          passed={passed}
          hintKey={hintKey}
          confidence={confidence}
          progress={progress}
        />
      </main>

      {showTutorial && <Onboarding onComplete={handleTutorialComplete} />}
    </div>
  );
}
