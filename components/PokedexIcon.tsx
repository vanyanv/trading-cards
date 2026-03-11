export function PokedexIcon({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Body */}
      <rect x="4" y="4" width="56" height="56" rx="6" fill="currentColor" opacity="0.9" />
      {/* Screen bezel */}
      <rect x="10" y="12" width="34" height="28" rx="3" fill="currentColor" opacity="0.7" />
      {/* Screen */}
      <rect x="12" y="14" width="30" height="24" rx="2" className="fill-green-400/80" />
      {/* Screen shine */}
      <rect x="14" y="16" width="12" height="3" rx="1" fill="white" opacity="0.3" />
      {/* Lens / camera dot */}
      <circle cx="50" cy="18" r="4" className="fill-blue-400" />
      <circle cx="50" cy="18" r="2" fill="white" opacity="0.5" />
      {/* Button row */}
      <circle cx="50" cy="30" r="2.5" fill="currentColor" opacity="0.5" />
      <circle cx="50" cy="38" r="2.5" fill="currentColor" opacity="0.5" />
      {/* D-pad */}
      <rect x="12" y="46" width="12" height="4" rx="1" fill="currentColor" opacity="0.5" />
      <rect x="16" y="42" width="4" height="12" rx="1" fill="currentColor" opacity="0.5" />
      {/* Bottom buttons */}
      <rect x="30" y="46" width="8" height="4" rx="2" className="fill-green-500/60" />
      <rect x="42" y="46" width="8" height="4" rx="2" className="fill-red-500/60" />
      {/* Hinge line */}
      <line x1="4" y1="10" x2="60" y2="10" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}
