import { useState } from "react";

type Props = {
  onLogin: (name: string, powerUser: boolean) => void;
};

export function LoginScreen({ onLogin }: Props) {
  const [name, setName] = useState("");

  const ready = name.trim().length > 0;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <img src="/logo.webp" alt="" className="h-10 w-10 rounded-lg" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Stokoe</h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">ASL vocabulary practice</p>
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Your name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ready && onLogin(name.trim(), false)}
            placeholder="Enter your name"
            autoFocus
            className="w-full rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
          />

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={() => ready && onLogin(name.trim(), true)}
              disabled={!ready}
              className="py-3 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 hover:border-slate-600 transition-colors text-left"
            >
              <div className="font-semibold mb-0.5">Power user</div>
              <div className="text-xs text-slate-400 font-normal">Skip the tour</div>
            </button>

            <button
              onClick={() => ready && onLogin(name.trim(), false)}
              disabled={!ready}
              className="py-3 px-4 rounded-xl bg-white text-slate-900 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors text-left"
            >
              <div className="font-semibold mb-0.5">New here</div>
              <div className="text-xs text-slate-500 font-normal">Take the primer</div>
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-600 text-center mt-4">
          Progress is saved locally on this device. Camera frames never leave your browser.
        </p>
      </div>
    </div>
  );
}
