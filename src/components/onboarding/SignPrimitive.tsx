type Kind = "where" | "shape" | "move";

export function SignPrimitive({ kind }: { kind: Kind }) {
  return (
    <svg viewBox="0 0 240 300" className="ob-primitive" aria-hidden="true">
      <defs>
        <filter id={`ob-glow-${kind}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Shared torso silhouette */}
      <g stroke="var(--rule)" strokeWidth="1.2" fill="none" strokeLinecap="round">
        <circle cx="120" cy="62" r="22" />
        <line x1="111" y1="84" x2="111" y2="100" />
        <line x1="129" y1="84" x2="129" y2="100" />
        <path d="M 46 150 Q 66 110 111 100 L 129 100 Q 174 110 194 150" />
        <path d="M 46 150 L 52 290" />
        <path d="M 194 150 L 188 290" />
      </g>

      {kind === "where" && (
        <g>
          <circle cx="120" cy="46"  r="2.5" fill="var(--fg-faint)" opacity=".55" />
          <circle cx="120" cy="82"  r="2.5" fill="var(--fg-faint)" opacity=".55" />
          <circle cx="78"  cy="160" r="2.5" fill="var(--fg-faint)" opacity=".55" />
          <circle cx="162" cy="160" r="2.5" fill="var(--fg-faint)" opacity=".55" />
          <circle cx="120" cy="230" r="2.5" fill="var(--fg-faint)" opacity=".55" />
          <circle cx="120" cy="172" r="7"   fill="var(--accent)" filter={`url(#ob-glow-${kind})`} />
          <circle cx="120" cy="172" r="14"  fill="none" stroke="var(--accent)" strokeWidth="1" opacity=".4" />
        </g>
      )}

      {kind === "shape" && (
        <g transform="translate(120, 180)" filter={`url(#ob-glow-${kind})`}>
          <g stroke="var(--accent)" strokeWidth="1" fill="none" opacity=".35">
            <line x1="0" y1="0" x2="-28" y2="-18" />
            <line x1="0" y1="0" x2="-14" y2="-32" />
            <line x1="0" y1="0" x2="2"   y2="-36" />
            <line x1="0" y1="0" x2="18"  y2="-32" />
            <line x1="0" y1="0" x2="30"  y2="-14" />
          </g>
          <g fill="var(--accent)">
            <circle cx="-28" cy="-18" r="3.2" />
            <circle cx="-14" cy="-32" r="3.2" />
            <circle cx="2"   cy="-36" r="3.2" />
            <circle cx="18"  cy="-32" r="3.2" />
            <circle cx="30"  cy="-14" r="3.2" />
          </g>
          <circle cx="0" cy="0" r="2" fill="var(--accent)" opacity=".55" />
        </g>
      )}

      {kind === "move" && (
        <g filter={`url(#ob-glow-${kind})`}>
          <circle cx="74" cy="178" r="3" fill="var(--fg-faint)" opacity=".55" />
          <path
            d="M 74 178 Q 120 130 166 178"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.4"
            strokeDasharray="2 4"
            strokeLinecap="round"
            opacity=".85"
          />
          <circle cx="166" cy="178" r="6"   fill="var(--accent)" />
          <circle cx="90"  cy="160" r="1.8" fill="var(--accent)" opacity=".25" />
          <circle cx="120" cy="142" r="2"   fill="var(--accent)" opacity=".4" />
          <circle cx="150" cy="160" r="2.2" fill="var(--accent)" opacity=".6" />
        </g>
      )}
    </svg>
  );
}
