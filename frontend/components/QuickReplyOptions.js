"use client";

import { useState } from "react";
import styles from "./QuickReplyOptions.module.css";

/**
 * Reusable clickable option buttons for AI questions.
 * When user clicks an option, it sends the answer through the chat flow.
 * "Other" option shows a text input for custom answers.
 *
 * Props:
 * - title: string (e.g., "Smart Question" or undefined)
 * - options: string[] (e.g., ["Student", "Salaried", "Self-employed"])
 * - onSelect: (answer: string) => void
 */
export default function QuickReplyOptions({ title, options = [], onSelect }) {
  const [showOther, setShowOther] = useState(false);
  const [otherText, setOtherText] = useState("");

  const handleSelect = (option) => {
    if (option === "Other") {
      setShowOther(true);
      return;
    }
    onSelect(option);
  };

  const handleSubmitOther = () => {
    if (otherText.trim()) {
      onSelect(otherText.trim());
      setOtherText("");
      setShowOther(false);
    }
  };

  if (options.length === 0) return null;

  return (
    <div className={styles.container}>
      {title && <span className={styles.title}>{title}</span>}
      <div className={styles.options}>
        {options.map((opt) => (
          <button
            key={opt}
            className={styles.option}
            onClick={() => handleSelect(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
      {showOther && (
        <div className={styles.otherInput}>
          <input
            type="text"
            className={styles.textInput}
            placeholder="Type your answer..."
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmitOther();
            }}
            autoFocus
          />
          <button className={styles.submitOther} onClick={handleSubmitOther}>
            Send
          </button>
        </div>
      )}
    </div>
  );
}
