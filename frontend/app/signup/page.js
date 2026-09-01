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
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await signup(email, fullName, password, city || null);
      toast.success("Account created! Welcome aboard 🎉");
    } catch (err) {
      toast.error(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.authPage}>
      <div className={styles.glowOrb1} />
      <div className={styles.glowOrb2} />

      {/* Header */}
      <header className={styles.authHeader}>
        <span className={styles.authHeaderBrand}>AI Banking Advisor</span>
        <div className={styles.authHeaderLogo}>AI</div>
        <span className={styles.authHeaderNav}>Create Account</span>
      </header>

      {/* Main */}
      <div className={styles.authMain}>
        <h1 className={styles.authHeading}>Begin Your Journey</h1>
        <p className={styles.authTagline}>Start your smart banking experience today</p>

        <div className={styles.authCard}>
          <div className={styles.logoSection}>
            <div className={styles.logoIcon}>
              <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="12" fill="url(#sg)" />
                <path d="M14 28C14 22.477 18.477 18 24 18C29.523 18 34 22.477 34 28" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="24" cy="28" r="3" fill="white"/>
                <path d="M18 34H30" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <defs><linearGradient id="sg" x1="0" y1="0" x2="48" y2="48"><stop stopColor="#d4af37"/><stop offset="1" stopColor="#b8860b"/></linearGradient></defs>
              </svg>
            </div>
            <h2 className={styles.authTitle}>Create your account</h2>
          </div>

          <form onSubmit={handleSubmit} className={styles.authForm}>
            <div className={styles.fieldGroup}>
              <label className="label" htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                className="input-field"
                placeholder="Muhammad Ahmed"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className="label" htmlFor="signupEmail">Email Address</label>
              <input
                id="signupEmail"
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className="label" htmlFor="signupPassword">Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  id="signupPassword"
                  type={showPassword ? "text" : "password"}
                  className="input-field"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
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
            </div>

            <div className={styles.fieldGroup}>
              <label className="label" htmlFor="city">City (optional)</label>
              <select
                id="city"
                className="input-field"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              >
                <option value="">Select your city</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : "Create Account"}
            </button>
          </form>

          <p className={styles.switchLink}>
            Already have an account?{" "}
            <Link href="/login">Sign in</Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className={styles.authFooter}>
        <p className={styles.authFooterText}>© 2024 AI Banking Advisor · Powered by Groq LLaMA 3.3</p>
      </footer>
    </main>
  );
}
