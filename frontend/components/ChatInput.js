"use client";

import { useRef } from "react";
import styles from "./ChatInput.module.css";

/**
 * Chat input bar with integrated mic button and EN|UR toggle.
 * Preserves existing send functionality via onSend callback.
 */
export default function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "Type your message...",
  inputRef,
}) {
  const internalRef = useRef(null);
  const ref = inputRef || internalRef;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className={styles.inputArea}>
      <div className={styles.inputWrapper}>
        <textarea
          ref={ref}
          className={styles.chatInput}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          rows={1}
        />

        {/* Controls */}
        <div className={styles.controls}>
          {/* Mic button — visually present, disabled for now */}
          <button
            className={styles.micBtn}
            disabled
            title="Voice input coming soon"
            aria-label="Voice input"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </button>

          {/* EN | UR toggle — visually present, non-functional for now */}
          <div className={styles.langToggle} title="Language switching coming soon">
            <span className={styles.langActive}>EN</span>
            <span className={styles.langDivider}>|</span>
            <span className={styles.langInactive}>UR</span>
          </div>

          {/* Send button */}
          <button
            className={styles.sendBtn}
            onClick={onSend}
            disabled={disabled}
            aria-label="Send message"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
