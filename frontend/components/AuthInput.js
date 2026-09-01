"use client";

import { useState } from "react";
import styles from "./AuthInput.module.css";

/**
 * Reusable auth input with field-level error display.
 * Supports text, email, password, and select types.
 */
export default function AuthInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  required = false,
  autoComplete,
  options = null, // for select type
  minLength,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;
  const hasError = !!error;

  const commonProps = {
    id,
    value,
    onChange,
    placeholder,
    required,
    autoComplete,
    minLength,
  };

  if (options) {
    return (
      <div className={styles.field}>
        <label className={styles.label} htmlFor={id}>{label}</label>
        <div className={hasError ? styles.inputWrapError : styles.inputWrap}>
          <select
            className={styles.select}
            {...commonProps}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <svg className={styles.chevron} width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        {hasError && <span className={styles.errorText}>{error}</span>}
      </div>
    );
  }

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>{label}</label>
      <div className={hasError ? styles.inputWrapError : styles.inputWrap}>
        <input
          type={inputType}
          className={styles.input}
          {...commonProps}
        />
        {isPassword && (
          <button
            type="button"
            className={styles.eyeBtn}
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        )}
      </div>
      {hasError && <span className={styles.errorText}>{error}</span>}
    </div>
  );
}
