import { useState } from "react";
import "./login.css";

type Props = {
  onLogin: (name: string, powerUser: boolean) => void;
  exiting?: boolean;
};

export function LoginScreen({ onLogin, exiting }: Props) {
  const [name, setName] = useState("");

  const ready = name.trim().length > 0;

  return (
    <div className={`ls-root${exiting ? " ls-exit" : ""}`}>
      <div className="ls-card">
        <div className="ls-brand">
          <img src="/logo.webp" alt="" className="ls-logo" />
          <div className="ls-brand-text">
            <h1>Stokoe</h1>
            <p>ASL vocabulary practice</p>
          </div>
        </div>

        <div className="ls-field">
          <span className="ls-label">Your name</span>
          <input
            className="ls-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ready && onLogin(name.trim(), false)}
            placeholder="First name"
            autoFocus
          />
        </div>

        <div className="ls-actions">
          <button
            className="ls-btn ls-btn-power"
            onClick={() => ready && onLogin(name.trim(), true)}
            disabled={!ready}
          >
            <span className="ls-btn-label">Power user</span>
            <span className="ls-btn-sub">Skip the tour</span>
          </button>

          <button
            className="ls-btn ls-btn-new"
            onClick={() => ready && onLogin(name.trim(), false)}
            disabled={!ready}
          >
            <span className="ls-btn-label">New here</span>
            <span className="ls-btn-sub">Take the primer</span>
          </button>
        </div>

        <p className="ls-footer">
          Progress saved locally &middot; camera frames never leave your browser
        </p>
      </div>
    </div>
  );
}
