"use client";

import { useState } from "react";
import styles from "./QuickReplies.module.css";

/**
 * QuickReplies — Clickable option buttons for AI questions.
 *
 * When user clicks an option, it sends that text as if they typed it.
 * If "Other" is selected, shows a small text input.
 *
 * Props:
 *   label:    string — heading text (e.g., "Smart Question")
 *   options:  string[] — list of options
 *   onSelect: (text: string) => void — called when user picks an option
 *   disabled: boolean
 */
export default function QuickReplies({ label, options, onSelect, disabled = false }) {
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherText, setOtherText] = useState("");
  const [selected, setSelected] = useState(null);

  const handleClick = (option) => {
    if (disabled || selected) return;

    if (option.toLowerCase() === "other") {
      setShowOtherInput(true);
      return;
    }

    setSelected(option);
    onSelect(option);
  };

  const handleOtherSubmit = () => {
    if (!otherText.trim() || disabled) return;
    setSelected(otherText.trim());
    onSelect(otherText.trim());
    setShowOtherInput(false);
  };

  const handleOtherKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleOtherSubmit();
    }
  };

  return (
    <div className={styles.container}>
      {label && <div className={styles.label}>{label}</div>}

      <div className={styles.options}>
        {options.map((option, i) => (
          <button
            key={i}
            className={`${styles.optionBtn} ${selected === option ? styles.optionSelected : ""} ${selected && selected !== option ? styles.optionDimmed : ""}`}
            onClick={() => handleClick(option)}
            disabled={disabled || (selected && selected !== option)}
          >
            {option}
          </button>
        ))}
      </div>

      {showOtherInput && !selected && (
        <div className={styles.otherInput}>
          <input
            type="text"
            placeholder="Type your answer..."
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            onKeyDown={handleOtherKeyDown}
            autoFocus
            className={styles.otherField}
          />
          <button
            className={styles.otherSubmit}
            onClick={handleOtherSubmit}
            disabled={!otherText.trim()}
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Default quick-reply options for common banking categories.
 * Can be rendered directly as a convenience shortcut.
 */
export const BANKING_QUICK_REPLIES = [
  "Bank Account",
  "Loan",
  "Credit Card",
  "Investment",
  "Digital Banking",
  "Other",
];

export const EMPLOYMENT_OPTIONS = [
  "Student",
  "Salaried",
  "Self-employed",
  "Business Owner",
  "Other",
];
