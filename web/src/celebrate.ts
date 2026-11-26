/** Sons synthétisés (Web Audio, aucun fichier) et confettis sur canvas. */

let audio: AudioContext | undefined;

function playNotes(frequencies: number[], step: number): void {
  try {
    audio ??= new AudioContext();
    if (audio.state === 'suspended') void audio.resume();
  } catch {
    return; // pas de son sur cet appareil
  }
  const ctx = audio;
  frequencies.forEach((frequency, i) => {
    const start = ctx.currentTime + i * step;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.5);
  });
}

const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5;

export const playDoneSound = () => playNotes([C5, E5, G5], 0.09);
/** Petit « tic » pendant le tirage au sort. */
export const playTickSound = () => playNotes([C6], 0);
export const playAllDoneSound = () => playNotes([C5, E5, G5, C6, G5, C6], 0.13);

const CONFETTI_COLORS = ['#ffcf33', '#4f7cff', '#22a55a', '#ff8a3d', '#b061ff', '#2ec4d6'];
const CONFETTI_MS = 4000;

export function launchConfetti(): void {
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.append(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas.remove();

  const pieces = Array.from({ length: 180 }, (_, i) => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height * 0.5,
    vx: (Math.random() - 0.5) * 4,
    vy: 2 + Math.random() * 4,
    size: 8 + Math.random() * 10,
    angle: Math.random() * Math.PI,
    spin: (Math.random() - 0.5) * 0.3,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  }));

  const startedAt = performance.now();
  const frame = (now: number) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of pieces) {
      p.x += p.vx;
      p.y += p.vy;
      p.angle += p.spin;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }
    if (now - startedAt < CONFETTI_MS) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}
