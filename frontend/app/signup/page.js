"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import Link from "next/link";
import AuthInput from "@/components/AuthInput";
import BankBuildingBackground from "@/components/BankBuildingBackground";
import styles from "../login/auth.module.css";

const CITIES = [
  { value: "", label: "Select your city" },
  { value: "Karachi", label: "Karachi" },
  { value: "Lahore", label: "Lahore" },
  { value: "Islamabad", label: "Islamabad" },
  { value: "Rawalpindi", label: "Rawalpindi" },
  { value: "Faisalabad", label: "Faisalabad" },
  { value: "Multan", label: "Multan" },
  { value: "Peshawar", label: "Peshawar" },
  { value: "Quetta", label: "Quetta" },
  { value: "Sialkot", label: "Sialkot" },
  { value: "Hyderabad", label: "Hyderabad" },
  { value: "Gujranwala", label: "Gujranwala" },
  { value: "Bahawalpur", label: "Bahawalpur" },
  { value: "Sargodha", label: "Sargodha" },
  { value: "Abbottabad", label: "Abbottabad" },
  { value: "Other", label: "Other" },
];

export default function SignupPage() {
  const { signup } = useAuth();
  const toast = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!fullName) {
      errs.fullName = "Full name is required";
    }
    if (!email) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Please enter a valid email address";
    }
    if (!password) {
      errs.password = "Password is required";
    } else if (password.length < 8) {
      errs.password = "Password must be at least 8 characters";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await signup(email, fullName, password, city || null);
      toast.success("Account created! Welcome aboard 🎉");
    } catch (err) {
      toast.error(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.authPage}>
      <BankBuildingBackground />
      <div className={styles.authOverlay} />
      <div className={styles.glowOrb1} />
      <div className={styles.glowOrb2} />

      <div className={styles.authCard}>
        {/* Header with brain/AI icon */}
        <div className={styles.cardHeader}>
          <div className={styles.brainIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v.5A3.5 3.5 0 0 0 5.5 9c0 1.2.6 2.3 1.5 3A3.5 3.5 0 0 0 5.5 15 3.5 3.5 0 0 0 9 18.5V19a3 3 0 0 0 6 0v-.5A3.5 3.5 0 0 0 18.5 15a3.5 3.5 0 0 0-1-2.7A3.5 3.5 0 0 0 18.5 9 3.5 3.5 0 0 0 15 5.5V5a3 3 0 0 0-3-3z"/>
              <line x1="12" y1="5" x2="12" y2="19"/>
            </svg>
          </div>
          <span className={styles.brandText}>AI Banking Advisor</span>
        </div>

        <h1 className={styles.authHeading}>Create Account</h1>
        <p className={styles.authSubtitle}>Start your smart banking journey</p>

        <form onSubmit={handleSubmit} className={styles.authForm} noValidate>
          <AuthInput
            id="fullName"
            label="Full Name"
            type="text"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (errors.fullName) setErrors({ ...errors, fullName: null });
            }}
            placeholder="Muhammad Ahmed"
            error={errors.fullName}
            required
          />

          <AuthInput
            id="signupEmail"
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors({ ...errors, email: null });
            }}
            placeholder="you@example.com"
            error={errors.email}
            autoComplete="email"
            required
          />

          <AuthInput
            id="signupPassword"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors({ ...errors, password: null });
            }}
            placeholder="At least 8 characters"
            error={errors.password}
            minLength={8}
            required
          />

          <AuthInput
            id="city"
            label="City (optional)"
            type="select"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            options={CITIES}
          />

          <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
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
