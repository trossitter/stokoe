import type { VocabItem } from "../data/vocab";
import { NOTATION } from "../data/notation";
import { masteryLevel } from "../store/progress";
import type { SignRecord } from "../store/progress";

type Props = {
  item: VocabItem;
  record: SignRecord | undefined;
  sessionState: "idle" | "recording" | "evaluating" | "result";
  onNext: () => void;
  onRetry: () => void;
  passed: boolean | null;
  vocabIndex: number;
  vocabTotal: number;
};

export function SignPrompt({
  item,
  record,
  sessionState,
  onNext,
  onRetry,
  passed,
  vocabIndex,
  vocabTotal,
}: Props) {
  const mastery = masteryLevel(record);

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-400 uppercase tracking-wide">Sign this word</span>
            <span className="text-xs text-slate-300">·</span>
            <span className="text-xs text-slate-400">{vocabIndex + 1} / {vocabTotal}</span>
            {mastery === "mastered" && (
              <span className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">Mastered</span>
            )}
            {mastery === "learning" && (
              <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">Learning</span>
            )}
          </div>
          <h2 className="text-4xl font-bold text-slate-900 tracking-tight">{item.word}</h2>
          {NOTATION[item.id] && (
            <div
              className="inline-flex items-center mt-2 rounded-lg px-3 py-1.5"
              style={{ background: "#1e293b" }}
              title={NOTATION[item.id].readable}
              data-notation={NOTATION[item.id].ascii}
              data-readable={NOTATION[item.id].readable}
            >
              <p
                className="text-xl tracking-widest select-none"
                style={{ fontFamily: "StokoeTempo, monospace", color: "#cbd5e1" }}
              >
                {NOTATION[item.id].ascii}
              </p>
            </div>
          )}
          {record && record.attempts > 0 && (
            <p className="text-xs text-slate-400 mt-1">
              {record.passes} / {record.attempts} attempts passed
            </p>
          )}
        </div>

        {sessionState === "result" && passed !== null && (
          <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold ${passed ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"}`}>
            {passed ? "✓" : "✗"}
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2 min-h-[48px]">
        {sessionState === "idle" && (
          <p className="flex-1 py-3 text-center text-sm text-slate-400">
            Place both hands in the camera box to begin
          </p>
        )}
        {sessionState === "evaluating" && (
          <div className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-500 text-sm font-medium text-center">
            Evaluating…
          </div>
        )}
        {sessionState === "result" && (
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="flex gap-2">
              <button
                onClick={onRetry}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Try again
              </button>
              <button
                onClick={onNext}
                className="flex-1 py-3 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                Next sign →
              </button>
            </div>
            <p className="text-center text-xs text-slate-400">← swipe your hand to navigate →</p>
          </div>
        )}
      </div>
    </section>
  );
}
