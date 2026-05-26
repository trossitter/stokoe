import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { VocabItem } from "../data/vocab";
import { SIGN_VIDEOS } from "../data/videos";
import { MoteField } from "./onboarding/MoteField";

type Props = {
  sessionVocab: VocabItem[];
  allVocab: VocabItem[];
  onExit: () => void;
};

type RoundMode = "intro" | "question" | "summary";
type AnswerState = "idle" | "correct" | "wrong";

const QUESTION_LIMIT = 5;
const REVEAL_DELAY_MS = 2000;
const ADVANCE_DELAY_MS = 1200;

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function pickDecoys(correct: VocabItem, pool: VocabItem[], n = 3): VocabItem[] {
  const sameCategory = shuffle(
    pool.filter((item) => item.category === correct.category && item.id !== correct.id),
  );
  const other = shuffle(
    pool.filter((item) => item.category !== correct.category && item.id !== correct.id),
  );

  return [...sameCategory, ...other].slice(0, n);
}

function getVideoUrl(item: VocabItem): string | null {
  return SIGN_VIDEOS[item.id] ?? `/signs/${item.id}.mp4`;
}

function scoreHeading(score: number, total: number): string {
  const ratio = total === 0 ? 0 : score / total;
  if (ratio >= 0.8) return "Nice.";
  if (ratio >= 0.5) return "Getting there.";
  return "Keep going.";
}

export function BonusRound({ sessionVocab, allVocab, onExit }: Props) {
  const revealTimerRef = useRef<number | null>(null);
  const advanceTimerRef = useRef<number | null>(null);
  const playableVocab = useMemo(
    () => sessionVocab.filter((item) => !!getVideoUrl(item)),
    [sessionVocab],
  );
  const [mode, setMode] = useState<RoundMode>("intro");
  const [questionOrder, setQuestionOrder] = useState<VocabItem[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [options, setOptions] = useState<VocabItem[]>([]);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);

  const currentQuestion = questionOrder[questionIndex] ?? null;
  const totalQuestions = questionOrder.length;
  const videoUrl = currentQuestion ? getVideoUrl(currentQuestion) : null;

  const clearTimers = useCallback(() => {
    if (revealTimerRef.current) {
      window.clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
    if (advanceTimerRef.current) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }, []);

  const buildOptions = useCallback(
    (question: VocabItem) => shuffle([question, ...pickDecoys(question, allVocab)]),
    [allVocab],
  );

  const beginQuestion = useCallback((index: number, order: VocabItem[]) => {
    const question = order[index];
    if (!question) {
      setMode("summary");
      return;
    }

    clearTimers();
    setQuestionIndex(index);
    setSelectedId(null);
    setOptionsVisible(false);
    setOptions(buildOptions(question));
    revealTimerRef.current = window.setTimeout(() => {
      setOptionsVisible(true);
      revealTimerRef.current = null;
    }, REVEAL_DELAY_MS);
  }, [buildOptions, clearTimers]);

  const startRound = useCallback(() => {
    clearTimers();
    const nextOrder = shuffle(playableVocab).slice(0, QUESTION_LIMIT);
    setQuestionOrder(nextOrder);
    setScore(0);
    setAnswered(0);
    if (nextOrder.length === 0) {
      setMode("summary");
      return;
    }
    setMode("question");
    beginQuestion(0, nextOrder);
  }, [beginQuestion, clearTimers, playableVocab]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const handleAnswer = (item: VocabItem) => {
    if (!currentQuestion || selectedId) return;

    clearTimers();
    const correct = item.id === currentQuestion.id;
    setSelectedId(item.id);
    setOptionsVisible(true);
    setAnswered((count) => count + 1);
    if (correct) {
      setScore((value) => value + 1);
    }

    advanceTimerRef.current = window.setTimeout(() => {
      advanceTimerRef.current = null;
      if (questionIndex + 1 >= totalQuestions) {
        setMode("summary");
        return;
      }
      beginQuestion(questionIndex + 1, questionOrder);
    }, ADVANCE_DELAY_MS);
  };

  const answerState = (item: VocabItem): AnswerState => {
    if (!selectedId || !currentQuestion) return "idle";
    if (item.id === currentQuestion.id) return "correct";
    if (item.id === selectedId) return "wrong";
    return "idle";
  };

  return (
    <div
      className="relative h-screen overflow-hidden"
      style={{ background: "oklch(0.22 0.028 260)" }}
    >
      <div className="app-mote-bg">
        <MoteField />
      </div>

      <main className="relative z-10 flex h-full items-center justify-center p-4">
        <section
          className="flex h-full max-h-[900px] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border p-4 shadow-2xl sm:p-6"
          style={{
            background: "oklch(0.26 0.030 260 / 0.78)",
            backdropFilter: "blur(12px)",
            borderColor: "oklch(0.36 0.028 260 / 0.62)",
          }}
        >
          <header className="flex shrink-0 items-center justify-between gap-3">
            <div>
              <div
                className="text-[10px] uppercase tracking-[0.2em] text-slate-500"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Receptive ASL
              </div>
              <h1
                className="mt-1 text-4xl leading-none text-slate-100"
                style={{ fontFamily: "'Newsreader', Georgia, serif" }}
              >
                Bonus round
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="rounded-full border border-slate-700/70 bg-slate-950/30 px-3 py-2 text-xs uppercase tracking-[0.16em] text-slate-300"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                score: {score}/{answered}
              </span>
              <button
                type="button"
                onClick={onExit}
                className="rounded-lg border border-slate-700/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300 transition-colors hover:bg-slate-800/70 hover:text-slate-100"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Exit
              </button>
            </div>
          </header>

          {mode === "intro" && (
            <div className="flex flex-1 items-center justify-center px-2 py-10">
              <div className="max-w-2xl text-center">
                <p
                  className="text-[10px] uppercase tracking-[0.22em] text-slate-500"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Nice work
                </p>
                <h2
                  className="mt-3 text-5xl leading-none text-slate-50 sm:text-6xl"
                  style={{ fontFamily: "'Newsreader', Georgia, serif" }}
                >
                  Want a recognition round?
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-300">
                  Watch each sign first, then choose its gloss. It is optional and separate from production practice.
                </p>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={startRound}
                    className="rounded-xl border px-6 py-3 text-sm font-semibold transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={playableVocab.length === 0}
                    style={{
                      background: "oklch(0.94 0.042 85)",
                      borderColor: "oklch(0.94 0.042 85)",
                      color: "oklch(0.18 0.024 260)",
                    }}
                  >
                    Start bonus
                  </button>
                  <button
                    type="button"
                    onClick={onExit}
                    className="rounded-xl border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800/70"
                  >
                    Choose signs
                  </button>
                </div>
              </div>
            </div>
          )}

          {mode === "question" && currentQuestion && (
            <div className="flex flex-1 flex-col items-center justify-center gap-5 overflow-hidden py-4">
              <div className="w-full max-w-2xl">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] border border-slate-700/60 bg-slate-900 shadow-xl">
                  {videoUrl ? (
                    <video
                      key={currentQuestion.id}
                      src={videoUrl}
                      className="h-full w-full object-contain"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">
                      Reference unavailable
                    </div>
                  )}
                </div>
              </div>

              <div className="min-h-[188px] w-full max-w-2xl">
                {!optionsVisible && (
                  <div className="flex h-full items-center justify-center rounded-2xl border border-slate-700/60 bg-slate-950/24">
                    <p
                      className="text-[10px] uppercase tracking-[0.2em] text-slate-500"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      Watch first
                    </p>
                  </div>
                )}

                {optionsVisible && (
                  <div className="grid grid-cols-2 gap-2">
                    {options.map((option) => {
                      const state = answerState(option);
                      const correct = state === "correct";
                      const wrong = state === "wrong";

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleAnswer(option)}
                          disabled={!!selectedId}
                          className="min-h-[86px] rounded-xl border px-4 py-4 text-left transition-all disabled:cursor-default"
                          style={{
                            background: correct
                              ? "oklch(0.42 0.12 155 / 0.42)"
                              : wrong
                                ? "oklch(0.42 0.12 28 / 0.42)"
                                : "oklch(0.22 0.028 260 / 0.62)",
                            borderColor: correct
                              ? "oklch(0.74 0.14 155 / 0.72)"
                              : wrong
                                ? "oklch(0.72 0.14 28 / 0.72)"
                                : "oklch(0.36 0.028 260 / 0.58)",
                            color: "rgb(226 232 240)",
                          }}
                        >
                          <span
                            className="block text-sm font-semibold uppercase tracking-[0.08em]"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            {correct && selectedId ? `✓ ${option.word}` : option.word}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {mode === "summary" && (
            <div className="flex flex-1 items-center justify-center px-2 py-10">
              <div className="max-w-xl text-center">
                <p
                  className="text-[10px] uppercase tracking-[0.22em] text-slate-500"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Score {score} / {totalQuestions}
                </p>
                <h2
                  className="mt-3 text-6xl leading-none text-slate-50"
                  style={{ fontFamily: "'Newsreader', Georgia, serif" }}
                >
                  {scoreHeading(score, totalQuestions)}
                </h2>
                <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-300">
                  Receptive practice checks what you understand when someone else signs.
                </p>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={onExit}
                    className="rounded-xl border px-6 py-3 text-sm font-semibold transition-colors hover:brightness-110"
                    style={{
                      background: "oklch(0.94 0.042 85)",
                      borderColor: "oklch(0.94 0.042 85)",
                      color: "oklch(0.18 0.024 260)",
                    }}
                  >
                    Practice again
                  </button>
                  <button
                    type="button"
                    onClick={startRound}
                    className="rounded-xl border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800/70"
                    disabled={playableVocab.length === 0}
                  >
                    Play again
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
