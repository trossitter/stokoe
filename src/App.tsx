import { WebcamView } from "./components/WebcamView";
import { SignPrompt } from "./components/SignPrompt";
import { FeedbackPanel } from "./components/FeedbackPanel";

export default function App() {
  return (
    <div className="h-full flex flex-col bg-slate-50">
      <header className="px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">ASL Tutor</h1>
        <span className="text-xs text-slate-500">ASL 1 vocabulary practice</span>
      </header>
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 p-4 min-h-0">
        <div className="flex flex-col gap-4 min-h-0">
          <SignPrompt />
          <WebcamView />
        </div>
        <FeedbackPanel />
      </main>
    </div>
  );
}
