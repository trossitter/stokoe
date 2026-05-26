import { useMemo, useState } from "react";
import type { VocabItem } from "../data/vocab";
import { NOTATION } from "../data/notation";
import { NARRATIVE_PASSAGES } from "../data/narrativePassages";

type Props = {
  vocab: VocabItem[];
  onPracticeSign?: (id: string) => void;
};

type ParamKey = "tab" | "dez" | "sig";

type SymbolGroup = {
  title: string;
  items: Array<{ glyph: string; label: string }>;
};

const PARAMS: Array<{
  key: ParamKey;
  label: string;
  stokoeName: string;
  plain: (item: VocabItem) => string;
}> = [
  { key: "tab", label: "Location", stokoeName: "TAB", plain: (item) => item.params.location },
  { key: "dez", label: "Handshape", stokoeName: "DEZ", plain: (item) => item.params.handshape },
  { key: "sig", label: "Movement", stokoeName: "SIG", plain: (item) => item.params.movement },
];

const SYMBOL_GROUPS: SymbolGroup[] = [
  {
    title: "Locations",
    items: [
      { glyph: "0", label: "Neutral space" },
      { glyph: "P", label: "Forehead / brow" },
      { glyph: "U", label: "Chin / lower face" },
      { glyph: "}", label: "Cheek / temple" },
      { glyph: "[ ]", label: "Torso" },
      { glyph: "Q", label: "Face / head" },
    ],
  },
  {
    title: "Handshapes",
    items: [
      { glyph: "B", label: "Flat hand" },
      { glyph: "5", label: "Open spread" },
      { glyph: "A", label: "Fist" },
      { glyph: "G", label: "Index" },
      { glyph: "H", label: "Two fingers" },
      { glyph: "O", label: "Tapered O" },
      { glyph: "L", label: "Angle hand" },
      { glyph: "F", label: "F / okay" },
      { glyph: "Y", label: "Y hand" },
    ],
  },
  {
    title: "Movements",
    items: [
      { glyph: "Df", label: "Away / forward" },
      { glyph: "Dt", label: "Toward signer" },
      { glyph: "Dz", label: "Side to side" },
      { glyph: "D@", label: "Circle" },
      { glyph: "Dg", label: "Wrist twist" },
      { glyph: "Dx", label: "Contact" },
      { glyph: "D^", label: "Up" },
      { glyph: "Dv", label: "Down" },
    ],
  },
  {
    title: "Orientation",
    items: [
      { glyph: "f", label: "Palm away" },
      { glyph: "t", label: "Palm toward" },
      { glyph: "a", label: "Palm up" },
      { glyph: "b", label: "Palm down" },
      { glyph: "^", label: "Fingers up" },
      { glyph: ">", label: "Palm to side" },
    ],
  },
];

function Glyph({
  children,
  size = "text-2xl",
}: {
  children: string;
  size?: string;
}) {
  return (
    <span
      className={`${size} leading-none text-slate-100`}
      style={{ fontFamily: "StokoeTempo, monospace" }}
    >
      {children}
    </span>
  );
}

function formatGloss(gloss: string): string {
  return gloss.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function NotationLab({ vocab, onPracticeSign }: Props) {
  const signs = useMemo(
    () => vocab.filter((item) => NOTATION[item.id]).sort((a, b) => a.word.localeCompare(b.word)),
    [vocab],
  );
  const [selectedId, setSelectedId] = useState(() => signs[0]?.id ?? "");
  const [activePassageId, setActivePassageId] = useState(() => NARRATIVE_PASSAGES[0]?.id ?? "");
  const [showGlosses, setShowGlosses] = useState(true);
  const [stagedGloss, setStagedGloss] = useState<string | null>(null);
  const [showOrientation, setShowOrientation] = useState(false);
  const selected = signs.find((item) => item.id === selectedId) ?? signs[0];
  const notation = selected ? NOTATION[selected.id] : null;
  const activePassage = NARRATIVE_PASSAGES.find((passage) => passage.id === activePassageId) ?? NARRATIVE_PASSAGES[0];

  if (!selected || !notation) {
    return null;
  }

  return (
    <section
      className="h-full min-h-0 overflow-y-auto rounded-2xl border p-5 md:p-8"
      style={{
        background: "oklch(0.26 0.030 260 / 0.74)",
        backdropFilter: "blur(10px)",
        borderColor: "oklch(0.36 0.028 260 / 0.6)",
      }}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div
            className="mb-3 text-[10px] uppercase tracking-[0.2em] text-slate-500"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            TAB · DEZ · SIG
          </div>
          <h2
            className="text-5xl text-slate-100"
            style={{ fontFamily: "'Newsreader', Georgia, serif" }}
          >
            Notation Lab
          </h2>
        </div>

        <label className="grid gap-2">
          <span
            className="text-[10px] uppercase tracking-[0.18em] text-slate-500"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Sign
          </span>
          <select
            value={selected.id}
            onChange={(event) => setSelectedId(event.target.value)}
            className="h-11 min-w-52 rounded-lg border border-slate-700 bg-slate-950/50 px-3 text-sm font-semibold text-slate-100 outline-none focus:border-[oklch(0.94_0.042_85)]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {signs.map((item) => (
              <option key={item.id} value={item.id}>
                {item.word}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <section className="rounded-lg border border-slate-700/70 bg-slate-950/28 p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div
                className="text-[10px] uppercase tracking-[0.18em] text-slate-500"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Decode
              </div>
              <h3
                className="mt-1 text-3xl text-slate-100"
                style={{ fontFamily: "'Newsreader', Georgia, serif" }}
              >
                {selected.word}
              </h3>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/35 px-4 py-3">
              <Glyph size="text-4xl">{notation.ascii}</Glyph>
            </div>
          </div>

          <div className="mt-5 grid gap-2">
            {PARAMS.map((param) => (
              <div
                key={param.key}
                className="grid gap-3 rounded-lg border border-slate-700/60 bg-slate-950/30 p-3 sm:grid-cols-[96px_96px_minmax(0,1fr)] sm:items-center"
              >
                <button
                  type="button"
                  className={`text-left ${param.key === "dez" ? "cursor-pointer rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[oklch(0.94_0.042_85)]" : "cursor-default"}`}
                  onClick={() => {
                    if (param.key === "dez") setShowOrientation((value) => !value);
                  }}
                  aria-expanded={param.key === "dez" ? showOrientation : undefined}
                  disabled={param.key !== "dez"}
                >
                  <div
                    className="text-[10px] uppercase tracking-[0.18em] text-slate-500"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {param.stokoeName}
                  </div>
                  <div className="text-sm font-semibold text-slate-200">{param.label}</div>
                </button>
                <div className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-center">
                  <Glyph>{notation[param.key]}</Glyph>
                </div>
                <p className="text-sm leading-relaxed text-slate-300">
                  {param.plain(selected)}
                  {param.key === "dez" && showOrientation && (
                    <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                      Orientation: {selected.params.orientation}
                    </span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-700/70 bg-slate-950/28 p-4">
          <div
            className="mb-3 text-[10px] uppercase tracking-[0.18em] text-slate-500"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Symbol Key
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {SYMBOL_GROUPS.map((group) => (
              <div key={group.title}>
                <h3
                  className="mb-2 text-[11px] uppercase tracking-[0.16em] text-slate-400"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {group.title}
                </h3>
                <div className="grid gap-1.5">
                  {group.items.map((item) => (
                    <div
                      key={`${group.title}-${item.glyph}`}
                      className="flex items-center gap-3 rounded-md border border-slate-700/50 bg-slate-950/24 px-2.5 py-2"
                    >
                      <span className="w-9 shrink-0 text-center">
                        <Glyph size="text-xl">{item.glyph}</Glyph>
                      </span>
                      <span className="text-xs text-slate-300">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <a
            href="https://lingdept.wordpress.com/wp-content/uploads/2015/08/quickguidestokoenotation-pages.pdf"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex rounded-md border border-slate-700 px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800/70 hover:text-slate-200"
          >
            Quick Guide source
          </a>
        </section>
      </div>

      <section className="mt-3 rounded-lg border border-slate-700/70 bg-slate-950/28 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div
              className="text-[10px] uppercase tracking-[0.18em] text-slate-500"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Passage Studies
            </div>
              <h3
                className="mt-1 text-3xl text-slate-100"
                style={{ fontFamily: "'Newsreader', Georgia, serif" }}
              >
                Read a tiny story.
              </h3>
              {activePassage.entries.some((e) => e.status === "constructed") && (
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
                  Constructed with AI for practice. Please verify against a signed or published corpus before citation.
                </p>
              )}
            </div>

          <div className="flex flex-wrap gap-2">
            {NARRATIVE_PASSAGES.map((passage) => {
              const active = passage.id === activePassage.id;

              return (
                <button
                  key={passage.id}
                  type="button"
                  onClick={() => setActivePassageId(passage.id)}
                  className="rounded-full border px-3 py-2 text-xs font-semibold transition-colors"
                  style={{
                    borderColor: active ? "oklch(0.94 0.042 85 / 0.7)" : "oklch(0.36 0.028 260 / 0.7)",
                    background: active ? "oklch(0.94 0.042 85 / 0.14)" : "oklch(0.18 0.024 260 / 0.5)",
                    color: active ? "oklch(0.94 0.042 85)" : "rgb(203 213 225)",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {passage.title}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setShowGlosses((visible) => !visible)}
              className="rounded-full border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800/70"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {showGlosses ? "Hide glosses" : "Reveal glosses"}
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-white/10 bg-black/24 p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <div
                className="text-[10px] uppercase tracking-[0.18em] text-slate-500"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {activePassage.subtitle}
              </div>
              <h4
                className="mt-1 text-2xl text-slate-100"
                style={{ fontFamily: "'Newsreader', Georgia, serif" }}
              >
                {activePassage.title}
              </h4>
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-300">{activePassage.summary}</p>
          </div>

          <div className="mt-4 grid gap-2">
            {activePassage.entries.map((entry, index) => {
              const verifiedNotation = entry.notationId ? NOTATION[entry.notationId] : null;
              const ascii = verifiedNotation?.ascii ?? entry.ascii ?? "?";
              const readable = verifiedNotation?.readable ?? entry.description;
              const canPractice = !!entry.notationId && !!onPracticeSign;
              const glossLabel = showGlosses ? formatGloss(entry.gloss) : "—";

              return (
                <div
                  key={`${activePassage.id}-${entry.beat}-${entry.gloss}-${index}`}
                  className="grid gap-x-4 gap-y-1 rounded-lg border border-slate-700/60 bg-slate-950/30 p-3 md:grid-cols-[28px_minmax(0,1fr)_108px_minmax(0,1fr)] md:items-center"
                >
                  <div
                    className="text-[10px] uppercase tracking-[0.2em] text-slate-500 md:pt-0.5"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {entry.beat}
                  </div>
                  <div>
                    {canPractice ? (() => {
                      const entryKey = `${activePassage.id}-${entry.beat}-${entry.gloss}`;
                      const isStaged = stagedGloss === entryKey;
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            if (isStaged) {
                              onPracticeSign(entry.notationId!);
                              setStagedGloss(null);
                            } else {
                              setStagedGloss(entryKey);
                            }
                          }}
                          onBlur={() => { if (isStaged) setStagedGloss(null); }}
                          className="rounded-lg px-2 py-0.5 text-left outline-none transition-all"
                          aria-label={isStaged ? `Go to ${entry.gloss} in practice` : `Select ${entry.gloss}`}
                          style={{
                            border: isStaged
                              ? "1px solid oklch(0.94 0.042 85 / 0.55)"
                              : "1px solid transparent",
                            background: isStaged
                              ? "oklch(0.94 0.042 85 / 0.10)"
                              : "transparent",
                          }}
                        >
                          <span
                            className="text-2xl leading-tight"
                            style={{
                              fontFamily: "'Newsreader', Georgia, serif",
                              color: "oklch(0.94 0.042 85)",
                            }}
                          >
                            {glossLabel}
                          </span>
                          {isStaged && (
                            <span
                              className="ml-2 text-[10px] uppercase tracking-[0.16em]"
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                color: "oklch(0.94 0.042 85 / 0.7)",
                              }}
                            >
                              → Practice
                            </span>
                          )}
                        </button>
                      );
                    })() : (
                      <span
                        className="text-2xl leading-tight"
                        style={{
                          fontFamily: "'Newsreader', Georgia, serif",
                          color: "oklch(0.94 0.042 85)",
                        }}
                      >
                        {glossLabel}
                      </span>
                    )}
                  </div>
                  <div className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-center">
                    <Glyph>{ascii}</Glyph>
                  </div>
                  <div>
                    <p className="text-xs leading-relaxed text-slate-500">{readable}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </section>
  );
}
