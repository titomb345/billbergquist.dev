import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
}

const COLORS = [
  '#00d4aa', // mint
  '#ffd700', // gold
  '#ff6a00', // orange
  '#ef4444', // red
  '#a855f7', // purple
  '#38bdf8', // sky
];

const PARTICLE_COUNT = 80;
const DURATION_MS = 3000;

interface ConfettiProps {
  active: boolean;
}

export function Confetti({ active }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Spawn particles from top center, spread outward
    const cx = canvas.width / 2;
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: cx + (Math.random() - 0.5) * 200,
      y: -20,
      vx: (Math.random() - 0.5) * 8,
      vy: Math.random() * 4 + 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 6 + 4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      life: 1,
    }));

    const startTime = Date.now();

    function animate() {
      const elapsed = Date.now() - startTime;
      if (elapsed > DURATION_MS) {
        ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
        return;
      }

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.vy += 0.15; // gravity
        p.y += p.vy;
        p.vx *= 0.99; // air resistance
        p.rotation += p.rotationSpeed;
        p.life = Math.max(0, 1 - elapsed / DURATION_MS);

        ctx!.save();
        ctx!.globalAlpha = p.life;
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.rotation);
        ctx!.fillStyle = p.color;
        ctx!.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx!.restore();
      }

      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 200,
      }}
    />
  );
}
