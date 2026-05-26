import { useCallback, useEffect, useMemo, useState } from "react";
import type { VocabCategory, VocabItem } from "../data/vocab";

const LESSON_SIZE = 10;
const CATEGORY_ORDER: VocabCategory[] = [
  "Essentials",
  "Actions",
  "Colors",
  "Everyday",
  "Family",
  "Feelings",
  "Greetings",
  "Questions",
  "Numbers",
];

type Props = {
  vocab: VocabItem[];
  onStart: (indices: number[]) => void;
};

type IndexedVocabItem = {
  item: VocabItem;
  index: number;
};

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function compareCategory(a: VocabCategory, b: VocabCategory): number {
  return CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b);
}

function groupByCategory(entries: IndexedVocabItem[]): Array<[VocabCategory, IndexedVocabItem[]]> {
  const groups = new Map<VocabCategory, IndexedVocabItem[]>();
  for (const entry of entries) {
    const group = groups.get(entry.item.category) ?? [];
    group.push(entry);
    groups.set(entry.item.category, group);
  }
  return Array.from(groups.entries()).sort(([a], [b]) => compareCategory(a, b));
}

function sortByCategory(entries: IndexedVocabItem[]): IndexedVocabItem[] {
  return [...entries].sort((a, b) => compareCategory(a.item.category, b.item.category) || a.index - b.index);
}

function buildBalancedLessonIndices(vocab: VocabItem[]): number[] {
  const entries = vocab.map((item, index) => ({ item, index }));
  const groups = groupByCategory(entries).filter(([category]) => category !== "Numbers");
  const picked: number[] = [];
  const remainingByCategory = new Map<VocabCategory, IndexedVocabItem[]>();

  for (const [category, categoryEntries] of groups) {
    const shuffledEntries = shuffle(categoryEntries);
    const first = shuffledEntries.shift();
    if (first) {
      picked.push(first.index);
    }
    remainingByCategory.set(category, shuffledEntries);
  }

  while (picked.length < LESSON_SIZE) {
    let added = false;
    for (const [category] of shuffle(groups)) {
      const remaining = remainingByCategory.get(category) ?? [];
      const next = remaining.shift();
      if (!next) continue;
      picked.push(next.index);
      added = true;
      if (picked.length >= LESSON_SIZE) break;
    }
    if (!added) break;
  }

  return shuffle(picked).slice(0, LESSON_SIZE);
}

export function WordPicker({ vocab, onStart }: Props) {
  const [showSetup, setShowSetup] = useState(false);
  const [setupVisible, setSetupVisible] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [activeCategories, setActiveCategories] = useState<VocabCategory[]>([]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const selectedIndices = useMemo(() => Array.from(selectedSet), [selectedSet]);
  const selectedCount = selectedIndices.length;
  const activeCategorySet = useMemo(() => new Set(activeCategories), [activeCategories]);
  const displayVocab = useMemo(() => {
    const entries = sortByCategory(vocab.map((item, index) => ({ item, index })));
    if (activeCategories.length === 0) return entries;
    return entries.filter(({ item }) => activeCategorySet.has(item.category));
  }, [activeCategories.length, activeCategorySet, vocab]);
  const handleDecideForMe = useCallback(() => {
    onStart(buildBalancedLessonIndices(vocab));
  }, [onStart, vocab]);

  // Fade the setup modal in on mount
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setShowSetup(true);
      requestAnimationFrame(() => setSetupVisible(true));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const clearSelected = () => {
    setSelected([]);
  };

  const toggleCategory = (category: VocabCategory) => {
    const categoryIndices = vocab
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.category === category)
      .map(({ index }) => index);
    const isActive = activeCategories.includes(category);
    const nextActiveCategories = isActive
      ? activeCategories.filter((c) => c !== category)
      : [...activeCategories, category];

    setActiveCategories(nextActiveCategories);

    setSelected((current) => {
      if (isActive) return current.filter((index) => !categoryIndices.includes(index));
      if (activeCategories.length === 0) return categoryIndices;
      const added = categoryIndices.filter((index) => !current.includes(index));
      return Array.from(new Set([...current, ...added]));
    });
  };

  const toggle = (index: number) => {
    setSelected((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : Array.from(new Set([...current, index]))
    );
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
          <h2
            className="text-5xl text-slate-100"
            style={{ fontFamily: "'Newsreader', Georgia, serif" }}
          >
            Choose signs.
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleDecideForMe}
            className="rounded-xl border px-4 py-3 text-sm font-medium transition-colors hover:bg-slate-800/70"
            style={{
              borderColor: "oklch(0.36 0.028 260 / 0.8)",
              color: "rgb(226 232 240)",
            }}
          >
            Decide for Me
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between border-y border-slate-700/70 py-3">
        <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
          {selectedCount === 0 ? "None selected" : `${selectedCount} selected`}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORY_ORDER.map((category) => {
          const isActive = activeCategorySet.has(category);

          return (
            <button
              key={category}
              type="button"
              onClick={() => toggleCategory(category)}
              aria-pressed={isActive}
              className="rounded-full border px-3 py-2 text-[10px] uppercase tracking-[0.18em] transition-colors"
              style={{
                background: isActive ? "oklch(0.94 0.042 85 / 0.14)" : "oklch(0.22 0.028 260 / 0.56)",
                borderColor: isActive ? "oklch(0.94 0.042 85 / 0.58)" : "oklch(0.36 0.028 260 / 0.7)",
                color: isActive ? "oklch(0.94 0.042 85)" : "rgb(148 163 184)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {category}
            </button>
          );
        })}
      </div>

      <div className={`min-h-0 flex-1 overflow-y-auto pr-1 ${selectedCount > 0 ? "pb-28" : ""}`}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {displayVocab.map(({ item, index }) => {
            const isSelected = selectedSet.has(index);
            const isDisabled = !isSelected && selectedCount >= LESSON_SIZE;

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
                <span className="block text-sm font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {item.word}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedCount > 0 && (
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 z-10 flex -translate-y-1/2 justify-center px-5 md:px-8"
        >
          <div className="pointer-events-auto flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => onStart(selectedIndices)}
              className="inline-flex items-center justify-center rounded-xl border px-8 py-3 text-sm font-semibold shadow-2xl transition-colors hover:brightness-110"
              style={{
                background: "oklch(0.94 0.042 85)",
                borderColor: "oklch(0.94 0.042 85)",
                color: "oklch(0.18 0.024 260)",
              }}
            >
              <span className="-translate-y-px">
                {`Start with ${selectedCount}`}
              </span>
            </button>
            <button
              type="button"
              onClick={clearSelected}
              className="inline-flex items-center justify-center rounded-lg border border-slate-700/80 bg-slate-950/50 px-4 py-2 text-xs font-semibold text-slate-200 shadow-xl backdrop-blur transition-colors hover:bg-slate-800/75"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {showSetup && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 p-4 text-left backdrop-blur-[1px]"
          style={{ opacity: setupVisible ? 1 : 0, transition: "opacity 0.35s ease-out" }}
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
            <h3
              id="session-setup-title"
              className="text-4xl text-slate-100"
              style={{ fontFamily: "'Newsreader', Georgia, serif" }}
            >
              Choose signs.
            </h3>

            <div className="mt-6 grid gap-2">
              <button
                type="button"
                onClick={handleDecideForMe}
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
