export function CameraFocusScrim() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          backdropFilter: "blur(4px) brightness(0.62) saturate(0.72)",
          WebkitBackdropFilter: "blur(4px) brightness(0.62) saturate(0.72)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 50% 44%, transparent 0%, transparent 38%, black 64%, black 100%)",
          maskImage:
            "radial-gradient(ellipse at 50% 44%, transparent 0%, transparent 38%, black 64%, black 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "radial-gradient(ellipse at 50% 44%, oklch(0.94 0.042 85 / 0.08) 0%, transparent 38%, oklch(0.10 0.018 260 / 0.20) 58%, oklch(0.06 0.018 260 / 0.70) 100%), linear-gradient(90deg, oklch(0.06 0.018 260 / 0.44), transparent 24%, transparent 76%, oklch(0.06 0.018 260 / 0.44))",
          boxShadow: "inset 0 0 110px oklch(0.04 0.018 260 / 0.78)",
        }}
      />
    </>
  );
}
