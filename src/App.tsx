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
import { SwipeTutorial } from "./components/SwipeTutorial";

type SessionState = "idle" | "evaluating" | "result";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => getProfile());
  const [order] = useState<number[]>(() => shuffle(VOCAB.map((_, i) => i)));
  const [vocabIndex, setVocabIndex] = useState(0);
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [passed, setPassed] = useState<boolean | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [hintKey, setHintKey] = useState<HintKey | null>(null);
  const [progress, setProgress] = useState<Progress>(() => getProgress());

  const item = VOCAB[order[vocabIndex % VOCAB.length]];

  const handleLogin = (name: string, powerUser: boolean) => {
    setProfile(saveProfile(name, powerUser));
  };

  const handleTutorialComplete = useCallback(() => {
    if (!profile) return;
    setProfile(markTutorialDone(profile));
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

  const handleRetry = useCallback(() => {
    setPassed(null); setConfidence(null); setHintKey(null);
    setSessionState("idle");
  }, []);

  // Rightward hand swipe during result → advance to next sign
  useHandSwipe(videoRef, sessionState === "result", handleNext);

  if (!profile) return <LoginScreen onLogin={handleLogin} />;

  const showTutorial = !profile.tutorialDone;

  const displayState: "idle" | "recording" | "evaluating" | "result" =
    sessionState === "idle" ? "idle" :
    sessionState === "evaluating" ? "evaluating" : "result";

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden relative">
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
            sessionState={showTutorial ? "evaluating" : displayState}
            onFramesReady={handleFramesReady}
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

      {showTutorial && <SwipeTutorial videoRef={videoRef} onComplete={handleTutorialComplete} />}
    </div>
  );
}
