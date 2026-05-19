export function FeedbackPanel() {
  // TODO: show pass/fail badge + targeted hint after each attempt.
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col min-h-0">
      <h2 className="text-sm font-medium text-slate-700 mb-2">Feedback</h2>
      <div className="flex-1 overflow-y-auto space-y-3 text-sm">
        <div className="rounded-xl border border-slate-200 px-3 py-2 text-slate-600">
          Sign the prompted word to your camera. You'll get a pass/fail result
          and a hint if it didn't match.
        </div>
        <div className="rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-500">
          Hints will reference handshape, movement, location, orientation, or
          camera framing.
        </div>
      </div>
      <div className="mt-2 text-xs text-slate-400">[evaluation wiring coming soon]</div>
    </section>
  );
}
