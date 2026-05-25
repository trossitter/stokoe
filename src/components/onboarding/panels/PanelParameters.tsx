import { SignPrimitive } from "../SignPrimitive";

const items = [
  {
    kind: "where" as const,
    code: "TAB",
    title: "Where",
    body: "The location your hand takes against the body — forehead, chin, chest, the neutral space in front of you.",
  },
  {
    kind: "shape" as const,
    code: "DEZ",
    title: "Shape",
    body: "The configuration of the hand itself — fingers extended, curled, spread, the thumb's relationship to them.",
  },
  {
    kind: "move" as const,
    code: "SIG",
    title: "Move",
    body: "The path the hand traces — straight, arced, repeated, toward or away from the body.",
  },
];

export function PanelParameters() {
  return (
    <section className="ob-panel">
      <div className="ob-pad" style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div className="ob-micro" style={{ marginBottom: 20 }}>Three parameters</div>
        <h2 className="ob-h-1" style={{ maxWidth: "22ch", marginBottom: 72 }}>
          Every sign is <span className="ob-it">three things</span> at once.
        </h2>
        <div className="ob-params">
          {items.map((it) => (
            <article className="ob-param" key={it.kind}>
              <SignPrimitive kind={it.kind} />
              <div>
                <span className="ob-param-code">{it.code}</span>
                <h3 className="ob-param-title">{it.title}</h3>
                <p className="ob-param-body">{it.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
