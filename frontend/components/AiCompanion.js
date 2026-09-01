"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./AiCompanion.module.css";

const STATUS_MESSAGES = {
  idle: [
    "I'm here to assist you on your banking journey.",
    "Ask me anything about Pakistani banking.",
    "Need help with accounts, loans, or cards?",
  ],
  thinking: ["Let me check that for you..."],
  streaming: ["I'm working on your response..."],
  completed: ["Here's what I found."],
};

const STATUS_LABELS = {
  idle: "Idle",
  thinking: "Thinking...",
  streaming: "Responding...",
  completed: "Online",
};

export default function AiCompanion() {
  const [state, setState] = useState("idle");
  const [message, setMessage] = useState(STATUS_MESSAGES.idle[0]);
  const [blink, setBlink] = useState(false);
  const msgIndexRef = useRef(0);

  // Listen for AI state changes from chat pages
  useEffect(() => {
    const handler = (e) => {
      const { state: newState, message: customMsg } = e.detail || {};
      if (newState) setState(newState);
      if (customMsg) {
        setMessage(customMsg);
      } else {
        const msgs = STATUS_MESSAGES[newState] || STATUS_MESSAGES.idle;
        setMessage(msgs[0]);
      }
    };
    window.addEventListener("ai-companion-state", handler);
    return () => window.removeEventListener("ai-companion-state", handler);
  }, []);

  // Random blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 3500 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  // Rotate idle messages occasionally
  useEffect(() => {
    if (state !== "idle") return;
    const interval = setInterval(() => {
      const msgs = STATUS_MESSAGES.idle;
      msgIndexRef.current = (msgIndexRef.current + 1) % msgs.length;
      setMessage(msgs[msgIndexRef.current]);
    }, 12000);
    return () => clearInterval(interval);
  }, [state]);

  const isActive = state === "thinking" || state === "streaming";

  return (
    <div className={styles.companion}>
      <div className={styles.header}>
        <span className={styles.headerText}>AI Assistant Companion</span>
      </div>

      <div className={styles.robotContainer}>
        <div className={`${styles.glowHalo} ${isActive ? styles.glowActive : ""}`} />

        <div className={`${styles.robot} ${isActive ? styles.robotActive : ""} ${state === "idle" ? styles.robotIdle : ""}`}>
          {/* Antenna */}
          <div className={styles.antenna}>
            <div className={`${styles.antennaTip} ${isActive ? styles.antennaGlow : ""}`} />
          </div>

          {/* Head */}
          <div className={styles.head}>
            {/* Eyes */}
            <div className={styles.eyes}>
              <div className={`${styles.eye} ${blink ? styles.eyeBlink : ""} ${isActive ? styles.eyeGlow : ""}`} />
              <div className={`${styles.eye} ${blink ? styles.eyeBlink : ""} ${isActive ? styles.eyeGlow : ""}`} />
            </div>

            {/* Mouth / speaker */}
            <div className={styles.mouth}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`${styles.mouthBar} ${isActive ? styles.mouthBarActive : ""}`}
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>

          {/* Body */}
          <div className={styles.body}>
            <div className={styles.chestLight} />
          </div>
        </div>

        {/* Status */}
        <div className={styles.statusRow}>
          <span className={`${styles.statusDot} ${isActive ? styles.statusDotActive : ""}`} />
          <span className={styles.statusText}>{STATUS_LABELS[state]}</span>
        </div>
      </div>

      {/* Speech bubble */}
      <div className={styles.speechBubble}>
        <p className={styles.speechText}>{message}</p>
      </div>
    </div>
  );
}
