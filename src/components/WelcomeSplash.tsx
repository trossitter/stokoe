import { useEffect, useState } from "react";

type Props = {
  name: string;
  onDone: () => void;
};

const DURATION = 1800; // ms visible before auto-dismiss

export function WelcomeSplash({ name, onDone }: Props) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), DURATION - 400);
    const doneTimer = setTimeout(onDone, DURATION);
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer); };
  }, [onDone]);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "oklch(0.22 0.028 260)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: "12px",
      zIndex: 200,
      opacity: fading ? 0 : 1,
      transition: "opacity 0.4s ease-out",
    }}>
      <p style={{
        margin: 0,
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: "0.7rem",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "oklch(0.58 0.022 260)",
        animation: "ws-rise 0.6s ease-out both",
      }}>
        Welcome back
      </p>
      <h2 style={{
        margin: 0,
        fontFamily: '"Newsreader", Georgia, serif',
        fontWeight: 300,
        fontSize: "clamp(1.8rem, 5vw, 2.6rem)",
        letterSpacing: "-0.02em",
        color: "oklch(0.97 0.008 85)",
        animation: "ws-rise 0.6s 0.1s ease-out both",
      }}>
        {name}.
      </h2>
      <style>{`
        @keyframes ws-rise {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
