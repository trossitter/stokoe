import { useEffect, useState } from "react";

const MESSAGES = [
  "Reading your handshape…",
  "Checking location…",
  "Analyzing movement…",
  "Scoring your sign…",
];

type Props = {
  visible: boolean;
};

export function ScoringOverlay({ visible }: Props) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (!visible) return;

    const timer = window.setInterval(() => {
      setStage((current) => Math.min(current + 1, MESSAGES.length - 1));
    }, 700);

    return () => window.clearInterval(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-6"
      style={{
        zIndex: 50,
        background: "oklch(0.22 0.028 260 / 0.92)",
        backdropFilter: "blur(6px)",
      }}
    >
      <style>
        {`
          @keyframes scoring-message-fade {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
      <div className="w-full max-w-[420px] flex flex-col items-center">
        <p
          key={stage}
          className="text-center"
          style={{
            animation: "scoring-message-fade 200ms ease-out",
            color: "oklch(0.97 0.008 85)",
            fontFamily: "'Newsreader', Georgia, serif",
            fontSize: "1.1rem",
            fontStyle: "italic",
            fontWeight: 300,
          }}
        >
          {MESSAGES[stage]}
        </p>

        <div className="mt-12 grid w-full grid-cols-4 gap-2" aria-hidden="true">
          {MESSAGES.map((message, index) => (
            <div
              key={message}
              className="h-[3px] overflow-hidden rounded-full"
              style={{ background: "oklch(0.36 0.028 260 / 0.6)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: index <= stage ? "100%" : "0%",
                  background: "oklch(0.94 0.042 85)",
                  transition: "width 600ms ease-in-out",
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
