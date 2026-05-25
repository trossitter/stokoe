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
            <span className="text-xs text-slate-500 uppercase tracking-wide">Sign this word</span>
            <span className="text-xs text-slate-600">·</span>
            <span className="text-xs text-slate-500">{vocabIndex + 1} / {vocabTotal}</span>
            {mastery === "mastered" && (
              <span className="text-xs bg-emerald-900/40 text-emerald-300 border border-emerald-700 rounded-full px-2 py-0.5">Mastered</span>
            )}
            {mastery === "learning" && (
              <span className="text-xs bg-amber-900/40 text-amber-300 border border-amber-700 rounded-full px-2 py-0.5">Learning</span>
            )}
          </div>
          <h2
            className="text-4xl font-bold text-slate-100 tracking-tight"
            style={{ fontFamily: "'Newsreader', Georgia, serif" }}
          >
            {item.word}
          </h2>
          {NOTATION[item.id] && (
            <div
              className="inline-flex items-center mt-2 rounded-lg px-3 py-1.5"
              style={{ background: "rgb(15 23 42 / 0.8)" }}
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
            <p className="text-xs text-slate-500 mt-1">
              {record.passes} / {record.attempts} attempts passed
            </p>
          )}
        </div>

        {sessionState === "result" && passed !== null && (
          <div className={`shrink-0 w-14 h-14 rounded-2xl border flex items-center justify-center text-2xl font-bold ${passed ? "bg-emerald-900/40 border-emerald-700 text-emerald-300" : "bg-red-900/40 border-red-700 text-red-300"}`}>
            {passed ? "✓" : "✗"}
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2 min-h-[48px]">
        {sessionState === "idle" && (
          <p className="flex-1 py-3 text-center text-sm text-slate-500">
            Place both hands in the camera box to begin
          </p>
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
