"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./AiCompanion.module.css";

/**
 * AI Companion Robot — sits on the right side of the chat.
 *
 * Props:
 *   status: "idle" | "thinking" | "streaming" | "done"
 *   userName: string (optional)
 */

const CONTEXTUAL_MESSAGES = {
  idle: [
    "Need any assistance?",
    "I can help with accounts, loans, cards and more.",
    "Ask me anything about Pakistani banking.",
    "I'm here to help.",
  ],
  greeting: "Hi! Nice to see you again 👋",
  thinking: "Let me check that for you...",
  streaming: [
    "I'm working on your answer...",
    "Analyzing the data...",
    "I'm comparing a few options for you...",
  ],
  done: "Here's what I found.",
};

export default function AiCompanion({ status = "idle", userName }) {
  const [message, setMessage] = useState(CONTEXTUAL_MESSAGES.greeting);
  const [showGreeting, setShowGreeting] = useState(true);
  const [blinking, setBlinking] = useState(false);
  const prevStatusRef = useRef(status);
  const idleIndexRef = useRef(0);
  const streamIndexRef = useRef(0);

  // Handle greeting → idle transition
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowGreeting(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Handle status-based messages
  useEffect(() => {
    if (showGreeting) return;

    if (status === "thinking") {
      setMessage(CONTEXTUAL_MESSAGES.thinking);
    } else if (status === "streaming") {
      const msgs = CONTEXTUAL_MESSAGES.streaming;
      setMessage(msgs[streamIndexRef.current % msgs.length]);
      streamIndexRef.current++;
    } else if (status === "done" && prevStatusRef.current === "streaming") {
      setMessage(CONTEXTUAL_MESSAGES.done);
      // After 5s, go back to idle message
      const timer = setTimeout(() => {
        const msgs = CONTEXTUAL_MESSAGES.idle;
        setMessage(msgs[idleIndexRef.current % msgs.length]);
        idleIndexRef.current++;
      }, 5000);
      prevStatusRef.current = status;
      return () => clearTimeout(timer);
    } else if (status === "idle") {
      const msgs = CONTEXTUAL_MESSAGES.idle;
      setMessage(msgs[idleIndexRef.current % msgs.length]);
    }

    prevStatusRef.current = status;
  }, [status, showGreeting]);

  // Rotate idle messages slowly (every 12 seconds)
  useEffect(() => {
    if (status !== "idle" || showGreeting) return;

    const interval = setInterval(() => {
      const msgs = CONTEXTUAL_MESSAGES.idle;
      idleIndexRef.current = (idleIndexRef.current + 1) % msgs.length;
      setMessage(msgs[idleIndexRef.current]);
    }, 12000);

    return () => clearInterval(interval);
  }, [status, showGreeting]);

  // Occasional blinking
  useEffect(() => {
    const interval = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 200);
    }, 4000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, []);

  const statusLabel =
    status === "thinking" ? "Thinking..." :
    status === "streaming" ? "Analyzing..." :
    status === "done" ? "Ready" : "Idle";

  const isActive = status === "thinking" || status === "streaming";

  return (
    <div className={styles.companion}>
      {/* Title */}
      <div className={styles.title}>
        AI Assistant<br />
        <span className={styles.titleSub}>Companion</span>
      </div>

      {/* Robot */}
      <div className={`${styles.robotWrap} ${isActive ? styles.robotActive : ""}`}>
        {/* Glow ring behind robot */}
        <div className={`${styles.glowRing} ${isActive ? styles.glowRingActive : ""}`} />

        <svg
          className={styles.robot}
          width="100"
          height="110"
          viewBox="0 0 120 130"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Antenna */}
          <line x1="60" y1="18" x2="60" y2="8" stroke="#5a9cf5" strokeWidth="2" strokeLinecap="round" />
          <circle cx="60" cy="5" r="4" fill="#5a9cf5" opacity="0.8">
            {isActive && <animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite" />}
          </circle>

          {/* Head */}
          <rect x="28" y="18" width="64" height="50" rx="16" fill="#1a2a4a" stroke="#2a4a7a" strokeWidth="1.5" />

          {/* Face plate */}
          <rect x="34" y="24" width="52" height="38" rx="12" fill="rgba(90,156,245,0.08)" stroke="rgba(90,156,245,0.2)" strokeWidth="1" />

          {/* Eyes */}
          <g>
            <circle cx="45" cy="42" r={blinking ? 1 : 6} fill="#5a9cf5" opacity="0.9">
              {isActive && <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />}
            </circle>
            <circle cx="45" cy="42" r={blinking ? 0 : 3} fill="#8bc4ff" opacity="0.6" />
            <circle cx="75" cy="42" r={blinking ? 1 : 6} fill="#5a9cf5" opacity="0.9">
              {isActive && <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />}
            </circle>
            <circle cx="75" cy="42" r={blinking ? 0 : 3} fill="#8bc4ff" opacity="0.6" />
          </g>

          {/* Mouth */}
          <path d="M50 52 Q60 58 70 52" stroke="#5a9cf5" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />

          {/* Neck */}
          <rect x="52" y="68" width="16" height="6" rx="3" fill="#1a2a4a" stroke="#2a4a7a" strokeWidth="1" />

          {/* Body */}
          <rect x="32" y="74" width="56" height="40" rx="12" fill="#1a2a4a" stroke="#2a4a7a" strokeWidth="1.5" />

          {/* Chest light */}
          <circle cx="60" cy="92" r="6" fill="rgba(90,156,245,0.15)" stroke="#5a9cf5" strokeWidth="1" opacity="0.6">
            {isActive && <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.5s" repeatCount="indefinite" />}
          </circle>
          <circle cx="60" cy="92" r="3" fill="#5a9cf5" opacity="0.4">
            {isActive && <animate attributeName="opacity" values="0.2;0.7;0.2" dur="1.5s" repeatCount="indefinite" />}
          </circle>

          {/* Arms */}
          <rect x="18" y="78" width="12" height="28" rx="6" fill="#1a2a4a" stroke="#2a4a7a" strokeWidth="1" />
          <rect x="90" y="78" width="12" height="28" rx="6" fill="#1a2a4a" stroke="#2a4a7a" strokeWidth="1" />

          {/* Ear accents */}
          <circle cx="28" cy="38" r="4" fill="#1a2a4a" stroke="#2a4a7a" strokeWidth="1" />
          <circle cx="92" cy="38" r="4" fill="#1a2a4a" stroke="#2a4a7a" strokeWidth="1" />
        </svg>
      </div>

      {/* Status */}
      <div className={styles.status}>
        <span className={`${styles.statusDot} ${isActive ? styles.statusDotActive : ""}`} />
        <span className={styles.statusText}>{statusLabel}</span>
      </div>

      {/* Speech bubble */}
      <div className={styles.speechBubble}>
        <p className={styles.speechText}>{message}</p>
      </div>
    </div>
  );
}
