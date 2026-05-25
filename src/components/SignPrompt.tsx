import { masteryLevel } from "../store/progress";
import type { SignRecord } from "../store/progress";

type Props = {
  record: SignRecord | undefined;
  sessionState: "idle" | "recording" | "evaluating" | "result";
  onRecord: () => void;
  onNext: () => void;
  onRetry: () => void;
  passed: boolean | null;
  vocabIndex: number;
  vocabTotal: number;
  paused?: boolean;
};

export function SignPrompt({
  record,
  sessionState,
  onRecord,
  onNext,
  onRetry,
  passed,
  vocabIndex,
  vocabTotal,
  paused = false,
}: Props) {
  const mastery = masteryLevel(record);

  return (
    <section
      className="rounded-2xl shadow-sm border p-4"
      style={{
        background: "oklch(0.26 0.030 260 / 0.75)",
        backdropFilter: "blur(8px)",
        borderColor: "oklch(0.36 0.028 260 / 0.6)",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-500 uppercase tracking-wide">Practice set</span>
            <span className="text-xs text-slate-600">·</span>
            <span className="text-xs text-slate-500">{vocabIndex + 1} / {vocabTotal}</span>
            {mastery === "mastered" && (
              <span className="text-xs bg-emerald-900/40 text-emerald-300 border border-emerald-700 rounded-full px-2 py-0.5">Mastered</span>
            )}
            {mastery === "learning" && (
              <span className="text-xs bg-amber-900/40 text-amber-300 border border-amber-700 rounded-full px-2 py-0.5">Learning</span>
            )}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Current</p>
              <p className="mt-1 text-lg font-medium text-slate-100">{vocabIndex + 1}</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Queued</p>
              <p className="mt-1 text-lg font-medium text-slate-100">{vocabTotal}</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Attempts</p>
              <p className="mt-1 text-lg font-medium text-slate-100">{record?.attempts ?? 0}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            The word to sign stays centered over the practice area.
          </p>
        </div>

        {sessionState === "result" && passed !== null && (
          <div className={`shrink-0 w-14 h-14 rounded-2xl border flex items-center justify-center text-2xl font-bold ${passed ? "bg-emerald-900/40 border-emerald-700 text-emerald-300" : "bg-red-900/40 border-red-700 text-red-300"}`}>
            {passed ? "✓" : "✗"}
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2 min-h-[48px]">
        {sessionState === "idle" && (
          paused ? (
            <p className="flex-1 py-3 text-center text-sm text-slate-500">
              Ready when you are.
            </p>
          ) : (
            <div className="flex-1 flex flex-col gap-1.5">
              <button
                onClick={onRecord}
                className="py-3 rounded-xl border text-sm font-medium transition-colors"
                style={{
                  background: "oklch(0.94 0.042 85)",
                  borderColor: "oklch(0.94 0.042 85)",
                  color: "oklch(0.18 0.024 260)",
                }}
              >
                Record attempt
              </button>
              <p className="text-center text-xs text-slate-500">
                You will get a short cue before capture starts.
              </p>
            </div>
          )
        )}
        {sessionState === "recording" && (
          <div className="flex-1 py-3 rounded-xl bg-red-900/40 border border-red-700 text-red-300 text-sm font-medium text-center">
            Recording your sign…
          </div>
        )}
        {sessionState === "evaluating" && (
          <div className="flex-1 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-400 text-sm font-medium text-center">
            Evaluating…
          </div>
        )}
        {sessionState === "result" && (
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="flex gap-2">
              <button
                onClick={onRetry}
                className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-200 text-sm font-medium hover:bg-slate-800/70 transition-colors"
              >
                Try again
              </button>
              <button
                onClick={onNext}
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-950 text-sm font-medium hover:bg-white transition-colors"
              >
                Next sign →
              </button>
            </div>
            <p className="text-center text-xs text-slate-500">← swipe your hand to navigate →</p>
          </div>
        )}
      </div>
    </section>
  );
}
