"use client";

import styles from "./AiCompanion.module.css";

const STATUS_LABELS = {
  idle: "Idle",
  thinking: "Thinking…",
  streaming: "Responding…",
  done: "Done",
};

export default function AiCompanion({ status = "idle", userName }) {
  const label = STATUS_LABELS[status] || "Idle";
  const active = status === "thinking" || status === "streaming";

  return (
    <aside className={styles.panel}>
      <div className={styles.glow} />

      <div className={styles.inner}>
        {status === "thinking" && (
          <div className={styles.thinkingBubble}>
            <span /><span /><span />
          </div>
        )}

        <div className={styles.mascotWrap}>
          <div className={styles.mascotHalo} />
          <div className={active ? styles.robotActive : styles.robot}>
            <RobotSvg blink />
          </div>
        </div>

        <h2 className={styles.name}>AI Assistant Companion</h2>
        <div className={styles.statusRow}>
          <span className={`${styles.dot} ${active ? styles.dotActive : ""}`} />
          <span className={styles.status}>{label}</span>
        </div>
        <p className={styles.body}>
          I&apos;m here to assist you on your banking journey.
        </p>
      </div>
    </aside>
  );
}

function RobotSvg() {
  return (
    <svg viewBox="0 0 200 200" className={styles.robotSvg} aria-hidden="true">
      <defs>
        {/* Clean, pure white/silver 3D gradient for the body */}
        <radialGradient id="aiSphereGrad" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#f0f4f8" />
          <stop offset="80%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#94a3b8" />
        </radialGradient>
        
        {/* Dark glassy visor gradient */}
        <linearGradient id="visorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1a2030" />
          <stop offset="100%" stopColor="#05080f" />
        </linearGradient>

        {/* Glowing eyes */}
        <radialGradient id="aiEyeGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#40f0ff" />
          <stop offset="100%" stopColor="#0088aa" />
        </radialGradient>

        <filter id="aiEyeGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Main 3D Sphere */}
      <circle cx="100" cy="100" r="70" fill="url(#aiSphereGrad)" />
      
      {/* Top glossy highlight to make it look like smooth plastic/metal */}
      <ellipse cx="100" cy="45" rx="45" ry="15" fill="#ffffff" opacity="0.6" filter="blur(2px)" />

      {/* Recessed Visor base (drop shadow) */}
      <rect x="38" y="72" width="124" height="60" rx="30" fill="#000000" opacity="0.4" transform="translate(0, 2)" filter="blur(2px)" />
      
      {/* Actual Visor */}
      <rect x="40" y="70" width="120" height="56" rx="28" fill="url(#visorGrad)" stroke="#64748b" strokeWidth="1.5" />

      {/* Visor internal reflection (glass shine) */}
      <rect x="45" y="73" width="110" height="15" rx="7.5" fill="#ffffff" opacity="0.15" />

      {/* Glowing eyes */}
      <g className={styles.eyes}>
        <ellipse cx="78" cy="98" rx="8" ry="12" fill="url(#aiEyeGrad)" filter="url(#aiEyeGlow)" />
        <ellipse cx="122" cy="98" rx="8" ry="12" fill="url(#aiEyeGrad)" filter="url(#aiEyeGlow)" />
      </g>

      {/* Glowing mouth indicator */}
      <rect x="90" y="116" width="20" height="4" rx="2" fill="#40f0ff" filter="url(#aiEyeGlow)" opacity="0.8" />
    </svg>
  );
}