import { useHandTracker } from "../hooks/useHandTracker";

export function WebcamView() {
  // TODO: request getUserMedia, render <video> + overlay canvas for hand landmarks.
  // For now this is a placeholder card so the layout compiles end-to-end.
  const tracker = useHandTracker();

  return (
    <section className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-medium text-slate-700">Camera</h2>
        <span className="text-xs text-slate-400">
          {tracker ? "tracker ready" : "tracker idle"}
        </span>
      </div>
      <div className="flex-1 rounded-xl bg-slate-900 text-slate-300 flex items-center justify-center text-sm">
        webcam preview goes here
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Camera frames stay local. Click Record to capture a signing attempt.
      </p>
    </section>
  );
}
