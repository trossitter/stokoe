const notes = [
  {
    label: "Scoring",
    body: "Checks handshape, movement, and location from camera frames.",
  },
  {
    label: "Privacy",
    body: "Frames and review clips stay in the browser. Nothing is uploaded.",
  },
  {
    label: "Progress",
    body: "Keeps track of your growing power under your name.",
  },
];

export function PanelPermission() {
  return (
    <section className="ob-panel">
      <div className="ob-pad ob-grid ob-grid-2 ob-permission-layout" style={{ height: "100%" }}>
        <div>
          <div className="ob-micro" style={{ marginBottom: 16 }}>Step 04 · Everything else</div>
          <h2 className="ob-h-1" style={{ maxWidth: "14ch", marginBottom: 32 }}>
            How it works.
          </h2>
          <ul className="ob-bullets">
            <li>Stokoe scores handshape, movement, and location.</li>
            <li>Frames and review clips stay in the browser.</li>
            <li>Nothing is uploaded.</li>
          </ul>
        </div>
        <div className="ob-info-stack" data-no-drag>
          {notes.map((note) => (
            <article className="ob-info-note" key={note.label}>
              <div className="ob-info-note-label">{note.label}</div>
              <p>{note.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
