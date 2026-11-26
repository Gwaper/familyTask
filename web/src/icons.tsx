/** Icônes dessinées de la vue rituel (traits arrondis, couleur héritée via `currentColor`). */

const stroke = {
  fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
} as const;

export function SpeakIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} strokeWidth="1.6">
      <path fill="currentColor" d="M10.5 6.2 6.6 9.3H4.2a1 1 0 0 0-1 1v3.4a1 1 0 0 0 1 1h2.4l3.9 3.1a.6.6 0 0 0 1-.5V6.7a.6.6 0 0 0-1-.5z" />
      <path d="M15.2 9a4.2 4.2 0 0 1 0 6" />
      <path d="M17.9 6.6a7.6 7.6 0 0 1 0 10.8" />
    </svg>
  );
}

/** Flèche légèrement courbe, comme tracée à la main ; `back` la tourne vers la gauche. */
export function ArrowIcon({ back }: { back: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" {...stroke} strokeWidth="2.8" style={back ? { transform: 'scaleX(-1)' } : undefined}>
      <path d="M5.5 12.5c3.5-.6 8-.6 12.5 0" />
      <path d="M13.5 7.5c1.8 1.4 3.4 3 4.5 5-1.1 2-2.7 3.6-4.5 5" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} strokeWidth="3.2">
      <path d="M5.5 12.5l4 4L18.5 7.5" />
    </svg>
  );
}

export function PersonIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} strokeWidth="2">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.2-3.5 4-5 7-5s5.8 1.5 7 5" />
    </svg>
  );
}

const PIPS = [[7, 7], [17, 7], [7, 17], [17, 17]] as const;

/** Face « 5 » d'un dé, points bombés (le point central reprend le bleu de « À faire »). */
export function DieIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <radialGradient id="die-pip" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#8a7558" />
          <stop offset="100%" stopColor="#4e3f2c" />
        </radialGradient>
        <radialGradient id="die-pip-center" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#7c82f0" />
          <stop offset="100%" stopColor="#3138b8" />
        </radialGradient>
      </defs>
      {PIPS.map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.2" fill="url(#die-pip)" />)}
      <circle cx="12" cy="12" r="2.2" fill="url(#die-pip-center)" />
    </svg>
  );
}

export function GearIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" {...stroke} strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}

export function PencilIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} strokeWidth="2.2">
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} strokeWidth="2.2">
      <path d="M5 7h14" />
      <path d="M10 7V5h4v2" />
      <path d="M7 7l1 12h8l1-12" />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} strokeWidth="2.8">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function RefreshIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} strokeWidth="2.4">
      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
      <path d="M20 5v6h-6" />
    </svg>
  );
}
