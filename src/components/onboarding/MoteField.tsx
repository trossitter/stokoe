import { useEffect, useRef } from "react";

type MoteEnergy = "calm" | "celebrate";

export function MoteField({
  density = 1,
  energy = "calm",
}: {
  density?: number;
  energy?: MoteEnergy;
}) {
  const cvsRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = cvsRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d")!;
    let w = 0, h = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    type Mote = {
      x: number; y: number; r: number;
      vx: number; vy: number; a: number;
      phase: number; speed: number;
      pulseAt: number; pulseDur: number;
    };
    const motes: Mote[] = [];

    function resize() {
      const rect = cvs!.getBoundingClientRect();
      w = rect.width; h = rect.height;
      cvs!.width = w * dpr; cvs!.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    const celebratory = energy === "celebrate";
    const N = Math.round((celebratory ? 180 : 80) * density);
    for (let i = 0; i < N; i++) {
      const burstAngle = Math.random() * Math.PI * 2;
      const burstSpeed = celebratory ? 0.16 + Math.random() * 0.28 : 0;
      motes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.pow(Math.random(), celebratory ? 1.8 : 2.6) * (celebratory ? 2.6 : 1.8) + 0.3,
        vx: celebratory ? Math.cos(burstAngle) * burstSpeed : (Math.random() - 0.5) * 0.06,
        vy: celebratory ? Math.sin(burstAngle) * burstSpeed - 0.08 : (Math.random() - 0.5) * 0.04 - 0.01,
        a: Math.random() * (celebratory ? 0.9 : 0.7) + (celebratory ? 0.35 : 0.2),
        phase: Math.random() * Math.PI * 2,
        speed: (celebratory ? 0.0022 : 0.0007) + Math.random() * (celebratory ? 0.0026 : 0.001),
        pulseAt: celebratory ? Math.random() * 1800 : Math.random() * 12000 + 4000,
        pulseDur: celebratory ? Math.random() * 1600 : 0,
      });
    }

    let raf: number;
    let last = performance.now();

    function tick(now: number) {
      const dt = Math.min(64, now - last);
      last = now;
      ctx.clearRect(0, 0, w, h);

      for (const m of motes) {
        m.x += m.vx * (dt / 16);
        m.y += m.vy * (dt / 16);
        if (m.x < -4) m.x = w + 4;
        if (m.x > w + 4) m.x = -4;
        if (m.y < -4) m.y = h + 4;
        if (m.y > h + 4) m.y = -4;
        m.phase += m.speed * dt;

        m.pulseAt -= dt;
        if (m.pulseAt <= 0) {
          m.pulseDur = (celebratory ? 900 : 1400) + Math.random() * (celebratory ? 900 : 1200);
          m.pulseAt = celebratory ? 900 + Math.random() * 2400 : 8000 + Math.random() * 16000;
        }
        let pulse = 0;
        if (m.pulseDur > 0) {
          const t = 1 - m.pulseDur / (celebratory ? 1800 : 2200);
          pulse = Math.sin(t * Math.PI) * (celebratory ? 1.9 : 1.2);
          m.pulseDur -= dt;
        }

        const tw = (Math.sin(m.phase) + 1) * 0.5;
        const alpha = m.a * (0.55 + tw * 0.45) + pulse * 0.55;
        const r = m.r * (1 + pulse * (celebratory ? 2.2 : 1.4));

        if (r > 0.9 || pulse > 0.1) {
          const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, r * 8);
          g.addColorStop(0, `oklch(0.95 0.04 85 / ${Math.min(1, alpha) * 0.42})`);
          if (celebratory) {
            g.addColorStop(0.45, `oklch(0.78 0.08 210 / ${Math.min(1, alpha) * 0.16})`);
          }
          g.addColorStop(1, `oklch(0.95 0.04 85 / 0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(m.x, m.y, r * 8, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = `oklch(0.97 0.02 85 / ${Math.min(1, alpha)})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [density, energy]);

  return <canvas ref={cvsRef} className="ob-mote-field" aria-hidden="true" />;
}
