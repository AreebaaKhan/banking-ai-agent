/**
 * Subtle line-art bank building background for auth pages.
 * Classical architecture (pediment + columns) inspired by State Bank of Pakistan.
 */
export default function BankBuildingBackground() {
  return (
    <svg
      className="bank-bg"
      viewBox="0 0 1200 800"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity: 0.05,
        color: "#5c8fdc",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {/* Base platform */}
      <rect x="100" y="650" width="1000" height="12" stroke="currentColor" strokeWidth="1.5" />
      <rect x="80" y="662" width="1040" height="8" stroke="currentColor" strokeWidth="1.5" />

      {/* Steps */}
      <line x1="150" y1="630" x2="1050" y2="630" stroke="currentColor" strokeWidth="1" />
      <line x1="170" y1="615" x2="1030" y2="615" stroke="currentColor" strokeWidth="1" />

      {/* Columns - left group */}
      {[0, 1, 2, 3].map((i) => {
        const x = 200 + i * 60;
        return (
          <g key={`l${i}`}>
            <rect x={x} y="300" width="40" height="315" stroke="currentColor" strokeWidth="1" />
            <line x1={x + 8} y1="300" x2={x + 8} y2="615" stroke="currentColor" strokeWidth="0.5" />
            <line x1={x + 20} y1="300" x2={x + 20} y2="615" stroke="currentColor" strokeWidth="0.5" />
            <line x1={x + 32} y1="300" x2={x + 32} y2="615" stroke="currentColor" strokeWidth="0.5" />
            {/* Capital */}
            <rect x={x - 4} y="290" width="48" height="14" stroke="currentColor" strokeWidth="1" />
          </g>
        );
      })}

      {/* Columns - center group (wider entrance) */}
      {[0, 1, 2, 3].map((i) => {
        const x = 500 + i * 55;
        return (
          <g key={`c${i}`}>
            <rect x={x} y="300" width="40" height="315" stroke="currentColor" strokeWidth="1" />
            <line x1={x + 8} y1="300" x2={x + 8} y2="615" stroke="currentColor" strokeWidth="0.5" />
            <line x1={x + 20} y1="300" x2={x + 20} y2="615" stroke="currentColor" strokeWidth="0.5" />
            <line x1={x + 32} y1="300" x2={x + 32} y2="615" stroke="currentColor" strokeWidth="0.5" />
            <rect x={x - 4} y="290" width="48" height="14" stroke="currentColor" strokeWidth="1" />
          </g>
        );
      })}

      {/* Columns - right group */}
      {[0, 1, 2, 3].map((i) => {
        const x = 780 + i * 60;
        return (
          <g key={`r${i}`}>
            <rect x={x} y="300" width="40" height="315" stroke="currentColor" strokeWidth="1" />
            <line x1={x + 8} y1="300" x2={x + 8} y2="615" stroke="currentColor" strokeWidth="0.5" />
            <line x1={x + 20} y1="300" x2={x + 20} y2="615" stroke="currentColor" strokeWidth="0.5" />
            <line x1={x + 32} y1="300" x2={x + 32} y2="615" stroke="currentColor" strokeWidth="0.5" />
            <rect x={x - 4} y="290" width="48" height="14" stroke="currentColor" strokeWidth="1" />
          </g>
        );
      })}

      {/* Architrave (horizontal beam above columns) */}
      <rect x="150" y="270" width="900" height="20" stroke="currentColor" strokeWidth="1.5" />

      {/* Pediment (triangular roof) */}
      <path d="M120 270 L600 140 L1080 270" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />

      {/* Pediment inner detail */}
      <path d="M170 265 L600 155 L1030 265" stroke="currentColor" strokeWidth="0.5" />

      {/* Central emblem in pediment */}
      <circle cx="600" cy="210" r="25" stroke="currentColor" strokeWidth="1" />
      <circle cx="600" cy="210" r="18" stroke="currentColor" strokeWidth="0.5" />
      <path d="M590 215 Q600 195 610 215" stroke="currentColor" strokeWidth="0.8" />

      {/* Doorway */}
      <rect x="555" y="500" width="90" height="115" stroke="currentColor" strokeWidth="1" />
      <path d="M555 500 Q600 470 645 500" stroke="currentColor" strokeWidth="1" fill="none" />
      <line x1="600" y1="500" x2="600" y2="615" stroke="currentColor" strokeWidth="0.5" />

      {/* Windows flanking doorway */}
      {[440, 720].map((x) => (
        <g key={x}>
          <rect x={x} y="520" width="60" height="80" stroke="currentColor" strokeWidth="1" />
          <line x1={x + 30} y1="520" x2={x + 30} y2="600" stroke="currentColor" strokeWidth="0.5" />
          <line x1={x} y1="560" x2={x + 60} y2="560" stroke="currentColor" strokeWidth="0.5" />
        </g>
      ))}

      {/* Upper windows */}
      {[250, 340, 820, 910].map((x) => (
        <g key={`uw${x}`}>
          <rect x={x} y="520" width="50" height="70" stroke="currentColor" strokeWidth="1" />
          <line x1={x + 25} y1="520" x2={x + 25} y2="590" stroke="currentColor" strokeWidth="0.5" />
          <line x1={x} y1="555" x2={x + 50} y2="555" stroke="currentColor" strokeWidth="0.5" />
        </g>
      ))}

      {/* Flag pole on top */}
      <line x1="600" y1="140" x2="600" y2="100" stroke="currentColor" strokeWidth="1" />
      <path d="M600 100 L625 108 L600 116" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  );
}
