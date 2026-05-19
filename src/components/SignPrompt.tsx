export function SignPrompt() {
  // TODO: pull from a vocab list (75-100 ASL 1 signs). For now show a static prompt.
  const word = "HELLO";

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Sign this word</p>
        <h2 className="text-3xl font-semibold text-slate-900 mt-1">{word}</h2>
      </div>
      <button
        type="button"
        className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium"
      >
        Record attempt
      </button>
    </section>
  );
}
