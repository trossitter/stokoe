import { useState } from "react";
import { masteryLevel } from "../store/progress";
import type { Progress } from "../store/progress";

type Props = {
  progress: Progress;
};

export function ProgressDrawer({ progress }: Props) {
  const [open, setOpen] = useState(false);
  const mastered = Object.values(progress).filter((record) => masteryLevel(record) === "mastered").length;
  const learning = Object.values(progress).filter((record) => masteryLevel(record) === "learning").length;
  const attempts = Object.values(progress).reduce((sum, record) => sum + record.attempts, 0);
  const recent = Object.entries(progress).slice(-20);

  return (
    <aside className="absolute bottom-3 right-3 z-40 flex justify-end">
      <div
        className={`rounded-2xl border shadow-2xl backdrop-blur transition-all duration-300 ${
          open ? "w-[min(280px,calc(100vw-32px))] p-4" : "w-auto p-1.5"
        }`}
        style={{
          background: open ? "oklch(0.18 0.024 260 / 0.88)" : "oklch(0.18 0.024 260 / 0.72)",
          borderColor: open ? "oklch(0.94 0.042 85 / 0.25)" : "oklch(0.36 0.028 260 / 0.72)",
        }}
      >
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={`flex items-center justify-between rounded-xl text-xs font-semibold uppercase tracking-[0.16em] transition-colors ${
            open ? "mb-3 w-full px-1 py-1 text-slate-200" : "px-3 py-2 text-slate-300 hover:bg-slate-800/60"
          }`}
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
          aria-expanded={open}
        >
          <span>Progress</span>
          <span className={open ? "text-slate-500" : "ml-2 text-slate-500"}>
            {open ? "Hide" : `${attempts}`}
          </span>
        </button>

        {open && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-slate-700/70 bg-slate-950/35 px-2 py-2">
                <p className="text-[9px] uppercase tracking-[0.16em] text-slate-500">Attempts</p>
                <p className="mt-1 text-lg font-semibold text-slate-100">{attempts}</p>
              </div>
              <div className="rounded-lg border border-slate-700/70 bg-slate-950/35 px-2 py-2">
                <p className="text-[9px] uppercase tracking-[0.16em] text-slate-500">Learning</p>
                <p className="mt-1 text-lg font-semibold text-amber-200">{learning}</p>
              </div>
              <div className="rounded-lg border border-slate-700/70 bg-slate-950/35 px-2 py-2">
                <p className="text-[9px] uppercase tracking-[0.16em] text-slate-500">Mastered</p>
                <p className="mt-1 text-lg font-semibold text-emerald-200">{mastered}</p>
              </div>
            </div>

            <div className="border-t border-slate-700/70 pt-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Recent signs
              </p>
              <div className="flex flex-wrap gap-1.5">
                {recent.length === 0 ? (
                  <span className="text-xs text-slate-500">No attempts yet.</span>
                ) : recent.map(([id, record]) => {
                  const level = masteryLevel(record);
                  return (
                    <div
                      key={id}
                      title={`${id}: ${record.passes}/${record.attempts}`}
                      className={`h-3 w-3 rounded-sm ${
                        level === "mastered" ? "bg-emerald-400" :
                        level === "learning" ? "bg-amber-300" :
                        "bg-slate-700"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
