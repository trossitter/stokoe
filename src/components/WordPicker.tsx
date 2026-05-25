import { useMemo, useState } from "react";
import type { VocabItem } from "../data/vocab";

const LESSON_SIZE = 10;
const NUMBER_SIGN_IDS = new Set(["one", "two", "three", "four", "six", "seven", "eight", "nine"]);

type Props = {
  vocab: VocabItem[];
  onStart: (indices: number[]) => void;
  onDecideForMe: () => void;
};

export function WordPicker({ vocab, onStart, onDecideForMe }: Props) {
  const [showSetup, setShowSetup] = useState(true);
  const [selected, setSelected] = useState<number[]>([]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const displayVocab = useMemo(
    () => vocab
      .map((item, index) => ({ item, index }))
      .sort((a, b) => {
        const aIsNumber = NUMBER_SIGN_IDS.has(a.item.id);
        const bIsNumber = NUMBER_SIGN_IDS.has(b.item.id);
        if (aIsNumber !== bIsNumber) return aIsNumber ? 1 : -1;
        return a.index - b.index;
      }),
    [vocab],
  );

  const toggle = (index: number) => {
    setSelected((current) => {
      if (current.includes(index)) {
        return current.filter((item) => item !== index);
      }
      if (current.length >= LESSON_SIZE) return current;
      return [...current, index];
    });
  };

  return (
    <section
      className="relative h-full min-h-0 rounded-2xl border p-5 md:p-8 flex flex-col gap-6"
      style={{
        background: "oklch(0.26 0.030 260 / 0.74)",
        backdropFilter: "blur(10px)",
        borderColor: "oklch(0.36 0.028 260 / 0.6)",
      }}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">
            {vocab.length} total signs
          </div>
          <h2
            className="mt-3 text-5xl text-slate-100"
            style={{ fontFamily: "'Newsreader', Georgia, serif" }}
          >
            Choose signs for this session.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Pick up to ten words for the set you are about to practice.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onDecideForMe}
            className="rounded-xl border px-4 py-3 text-sm font-medium transition-colors hover:bg-slate-800/70"
            style={{
              borderColor: "oklch(0.36 0.028 260 / 0.8)",
              color: "rgb(226 232 240)",
            }}
          >
            Decide for Me
          </button>
          <button
            onClick={() => selected.length > 0 && onStart(selected)}
            disabled={selected.length === 0}
            className="rounded-xl px-4 py-3 text-sm font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              background: "oklch(0.94 0.042 85)",
              color: "oklch(0.18 0.024 260)",
            }}
          >
            {selected.length > 0 ? `Start with ${selected.length}` : "Start selected"}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between border-y border-slate-700/70 py-3">
        <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
          {selected.length} / {LESSON_SIZE} selected
        </span>
        <button
          onClick={() => setSelected([])}
          disabled={selected.length === 0}
          className="text-xs text-slate-500 transition-colors hover:text-slate-300 disabled:opacity-40"
        >
          Clear
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {displayVocab.map(({ item, index }) => {
            const isSelected = selectedSet.has(index);
            const isDisabled = !isSelected && selected.length >= LESSON_SIZE;

            return (
              <button
                key={item.id}
                onClick={() => toggle(index)}
                disabled={isDisabled}
                className="min-h-[64px] rounded-xl border px-3 py-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-35"
                style={{
                  background: isSelected ? "oklch(0.94 0.042 85 / 0.14)" : "oklch(0.22 0.028 260 / 0.62)",
                  borderColor: isSelected ? "oklch(0.94 0.042 85 / 0.52)" : "oklch(0.36 0.028 260 / 0.58)",
                  color: isSelected ? "oklch(0.97 0.008 85)" : "rgb(203 213 225)",
                }}
              >
                <span className="block text-sm font-semibold">{item.word}</span>
              </button>
            );
          })}
        </div>
      </div>

      {showSetup && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 p-4 text-left backdrop-blur-[1px]"
          onClick={() => setShowSetup(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-setup-title"
            className="w-full max-w-md rounded-2xl border px-6 py-6 shadow-2xl"
            style={{
              background: "oklch(0.18 0.024 260 / 0.94)",
              borderColor: "oklch(0.94 0.042 85 / 0.42)",
              boxShadow: "0 18px 60px rgb(0 0 0 / 0.38), 0 0 34px oklch(0.94 0.042 85 / 0.14)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="text-xs uppercase tracking-[0.22em] text-slate-500">
              Guide your session
            </div>
            <h3
              id="session-setup-title"
              className="mt-3 text-4xl text-slate-100"
              style={{ fontFamily: "'Newsreader', Georgia, serif" }}
            >
              Choose what to practice.
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Pick a ten-sign set automatically, or choose your own signs from the list behind this window.
            </p>

            <div className="mt-6 grid gap-2">
              <button
                type="button"
                onClick={onDecideForMe}
                className="rounded-xl border px-4 py-3 text-sm font-semibold transition-colors hover:brightness-110"
                style={{
                  background: "oklch(0.94 0.042 85)",
                  borderColor: "oklch(0.94 0.042 85)",
                  color: "oklch(0.18 0.024 260)",
                }}
              >
                Decide for Me
              </button>
              <button
                type="button"
                onClick={() => setShowSetup(false)}
                className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800/70"
              >
                Choose My Own
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
