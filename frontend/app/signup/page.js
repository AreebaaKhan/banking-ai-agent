"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import Link from "next/link";
import styles from "../login/auth.module.css";

const CITIES = [
  "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad",
  "Multan", "Peshawar", "Quetta", "Sialkot", "Hyderabad",
  "Gujranwala", "Bahawalpur", "Sargodha", "Abbottabad", "Other",
];

export default function SignupPage() {
  const { signup } = useAuth();
  const toast = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });

  const clearError = (field) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = { fullName: "", email: "", password: "", confirmPassword: "" };
    let hasError = false;

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
      hasError = true;
    }
    if (!email) {
      newErrors.email = "Email address is required";
      hasError = true;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address";
      hasError = true;
    }
    if (!password) {
      newErrors.password = "Password is required";
      hasError = true;
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      hasError = true;
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
      hasError = true;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await signup(email, fullName, password, city || null);
      toast.success("Account created! Welcome aboard 🎉");
    } catch (err) {
      const msg = err.message || "Signup failed";
      if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("exists") || msg.toLowerCase().includes("registered")) {
        setErrors((prev) => ({ ...prev, email: "An account with this email already exists" }));
      } else if (msg.toLowerCase().includes("password")) {
        setErrors((prev) => ({ ...prev, password: msg }));
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.authPage}>
      {/* Background layers */}
      <div className={styles.authBg}>
        <div className={styles.authBgImage} />
        <div className={styles.authBgOverlay} />
      </div>
      <div className={styles.glowOrb1} />
      <div className={styles.glowOrb2} />

      {/* Glass card */}
      <div className={styles.authCard}>
        <div className={styles.logoSection}>
          <div className={styles.brandRow}>
            <div className={styles.brandIcon}>
              <img src="/images/brand-icon.png" alt="AI Banking Advisor" width={30} height={30} style={{ borderRadius: '8px', objectFit: 'cover' }} />
            </div>
            <span className={styles.brandName}>AI Banking Advisor</span>
          </div>

          <h1 className={styles.authTitle}>Create Account</h1>
          <p className={styles.authSubtitle}>Start your smart banking journey</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.authForm} noValidate>
          {/* Full Name */}
          <div className={styles.fieldGroup}>
            <label htmlFor="signup-name">Full Name</label>
            <input
              id="signup-name"
              type="text"
              className={errors.fullName ? styles.inputError : ""}
              placeholder="Muhammad Ahmed"
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); clearError("fullName"); }}
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? "signup-name-error" : undefined}
            />
            {errors.fullName && <span id="signup-name-error" className={styles.fieldError}>{errors.fullName}</span>}
          </div>

          {/* Email */}
          <div className={styles.fieldGroup}>
            <label htmlFor="signup-email">Email Address</label>
            <input
              id="signup-email"
              type="email"
              className={errors.email ? styles.inputError : ""}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "signup-email-error" : undefined}
            />
            {errors.email && <span id="signup-email-error" className={styles.fieldError}>{errors.email}</span>}
          </div>

          {/* Password */}
          <div className={styles.fieldGroup}>
            <label htmlFor="signup-password">Password</label>
            <div className={styles.passwordWrapper}>
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                className={errors.password ? styles.inputError : ""}
                placeholder="At least 8 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError("password");
                if (confirmPassword) clearError("confirmPassword");
              }}
              minLength={8}
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "signup-password-error" : undefined}
            />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
            {errors.password && <span id="signup-password-error" className={styles.fieldError}>{errors.password}</span>}
          </div>

          {/* Confirm password */}
          <div className={styles.fieldGroup}>
            <label htmlFor="signup-confirm-password">Confirm Password</label>
            <div className={styles.passwordWrapper}>
              <input
                id="signup-confirm-password"
                type={showPassword ? "text" : "password"}
                className={errors.confirmPassword ? styles.inputError : ""}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); clearError("confirmPassword"); }}
                autoComplete="new-password"
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={errors.confirmPassword ? "signup-confirm-password-error" : undefined}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide passwords" : "Show passwords"}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
            {errors.confirmPassword && <span id="signup-confirm-password-error" className={styles.fieldError}>{errors.confirmPassword}</span>}
          </div>

          {/* City */}
          <div className={styles.fieldGroup}>
            <label htmlFor="signup-city">City (optional)</label>
            <select
              id="signup-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            >
              <option value="">Select your city</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : "Create Account"}
          </button>
        </form>

        <p className={styles.switchLink}>
          Already have an account?{" "}
          <Link href="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
