import type { VocabItem } from "../data/vocab";
import type { HintKey } from "../model/signClassifier";
import { masteryLevel } from "../store/progress";
import type { Progress } from "../store/progress";

type Props = {
  item: VocabItem | null;
  sessionState: "idle" | "recording" | "evaluating" | "result";
  passed: boolean | null;
  hintKey: HintKey | null;
  confidence: number | null;
  progress: Progress;
  paused?: boolean;
};

const HINT_LABEL: Record<HintKey, string> = {
  handshape: "Handshape",
  movement: "Movement",
  location: "Location",
  orientation: "Orientation",
  framing: "Camera framing",
};

export function FeedbackPanel({ item, sessionState, passed, hintKey, confidence, progress, paused = false }: Props) {
  return (
    <section
      className="rounded-2xl shadow-sm border p-4 flex flex-col min-h-0 gap-4"
      style={{
        background: "oklch(0.26 0.030 260 / 0.75)",
        backdropFilter: "blur(8px)",
        borderColor: "oklch(0.36 0.028 260 / 0.6)",
      }}
    >

      {/* Live feedback */}
      <div className="flex-1 flex flex-col gap-3">
        <h2 className="text-sm font-medium text-slate-200">Feedback</h2>

        {sessionState === "idle" && (
          <p className="text-sm text-slate-400">
            {paused
              ? "Start from the prompt card when you are ready."
              : "Read the prompt, get situated, then press Record attempt when you are ready."}
          </p>
        )}

        {sessionState === "recording" && (
          <p className="text-sm text-red-300 font-medium">Recording your sign…</p>
        )}

        {sessionState === "evaluating" && (
          <p className="text-sm text-slate-400">Checking your attempt…</p>
        )}

        {sessionState === "result" && item && passed !== null && (
          <div className="flex flex-col gap-3">
            {/* Pass / fail */}
            <div className={`rounded-xl px-4 py-3 border ${passed ? "bg-emerald-900/40 border-emerald-700" : "bg-red-900/40 border-red-700"}`}>
              <p className={`font-semibold text-sm ${passed ? "text-emerald-300" : "text-red-300"}`}>
                {passed ? "Correct!" : "Not quite"}
              </p>
              {confidence !== null && (
                <p className="text-xs text-slate-400 mt-0.5">
                  Confidence: {Math.round(confidence * 100)}%
                </p>
              )}
            </div>

            {/* Hint */}
            {!passed && hintKey && (
              <div className="rounded-xl bg-slate-800/60 border border-slate-700 px-4 py-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                  {HINT_LABEL[hintKey]}
                </p>
                <p className="text-sm text-slate-200">
                  {item.hints[hintKey]}
                </p>
              </div>
            )}

            {/* Reference parameters on pass */}
            {passed && (
              <div className="rounded-xl bg-slate-800/60 border border-slate-700 px-4 py-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Sign parameters</p>
                {(["handshape", "movement", "location", "orientation"] as const).map((k) => (
                  <div key={k} className="mb-1.5">
                    <span className="text-xs font-medium text-slate-400 capitalize">{k}: </span>
                    <span className="text-xs text-slate-300">{item.params[k]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress summary */}
      <div className="border-t border-slate-700 pt-3">
        <p className="text-xs font-medium text-slate-400 mb-2">Session progress</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(progress).slice(-20).map(([id, rec]) => {
            const level = masteryLevel(rec);
            return (
              <div
                key={id}
                title={`${id}: ${rec.passes}/${rec.attempts}`}
                className={`w-3 h-3 rounded-sm ${
                  level === "mastered" ? "bg-emerald-400" :
                  level === "learning" ? "bg-amber-300" :
                  "bg-slate-700"
                }`}
              />
            );
          })}
        </div>
        <p className="text-xs text-slate-500 mt-1.5">
          {Object.values(progress).filter(r => masteryLevel(r) === "mastered").length} mastered
          · {Object.values(progress).filter(r => masteryLevel(r) === "learning").length} in progress
        </p>
      </div>
    </section>
  );
}
