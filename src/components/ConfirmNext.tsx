// Confirmation overlay for advancing to the next sign.
// Rendered inside the camera container so the student's attention stays on camera.
export function ConfirmNext({ onConfirm }: { onConfirm: () => void }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center cursor-pointer"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={onConfirm}
    >
      <div style={{
        background: "rgba(255,255,255,0.12)",
        border: "1.5px solid rgba(255,255,255,0.25)",
        borderRadius: 20,
        padding: "24px 36px",
        textAlign: "center",
      }}>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11,
                    letterSpacing: "0.1em", marginBottom: 10 }}>
          NEXT SIGN
        </p>
        <p style={{ color: "#fff", fontSize: 36, fontWeight: 700,
                    lineHeight: 1, marginBottom: 12 }}>
          →
        </p>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
          tap to continue
        </p>
      </div>
    </div>
  );
}
