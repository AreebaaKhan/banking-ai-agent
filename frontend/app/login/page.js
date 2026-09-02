"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import Link from "next/link";
import styles from "./auth.module.css";

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });

  const clearError = (field) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = { email: "", password: "" };
    let hasError = false;

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
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
    } catch (err) {
      const msg = err.message || "Login failed";
      if (msg.toLowerCase().includes("password") || msg.toLowerCase().includes("credentials") || msg.toLowerCase().includes("invalid")) {
        setErrors({ email: "", password: "Incorrect email or password" });
      } else if (msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("user")) {
        setErrors({ email: "No account found with this email", password: "" });
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
          {/* Brain icon + brand */}
          <div className={styles.brandRow} style={{ marginTop: '30px', marginBottom: '8px' }}>
            <div className={styles.brandIcon}>
              <img src="/images/brand-icon.png" alt="AI Banking Advisor" width={30} height={30} style={{ borderRadius: '8px', objectFit: 'cover' }} />
            </div>
            <span className={styles.brandName}>AI Banking Advisor</span>
          </div>
          <h1 className={styles.authTitle}>Welcome Back</h1>
          <p className={styles.authSubtitle}>Sign in to your AI Banking Advisor</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.authForm} noValidate>
          {/* Email */}
          <div className={styles.fieldGroup}>
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              className={errors.email ? styles.inputError : ""}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "login-email-error" : undefined}
            />
            {errors.email && <span id="login-email-error" className={styles.fieldError}>{errors.email}</span>}
          </div>

          {/* Password */}
          <div className={styles.fieldGroup}>
            <label htmlFor="login-password">Password</label>
            <div className={styles.passwordWrapper}>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className={errors.password ? styles.inputError : ""}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError("password"); }}
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "login-password-error" : undefined}
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
            {errors.password && <span id="login-password-error" className={styles.fieldError}>{errors.password}</span>}
          </div>

          {/* Submit */}
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : "Sign In"}
          </button>
        </form>

        <p className={styles.switchLink}>
          Don&apos;t have an account?{" "}
          <Link href="/signup">Create one</Link>
        </p>
      </div>
    </main>
  );
}
