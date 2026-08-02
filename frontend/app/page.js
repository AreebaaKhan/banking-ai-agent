"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import styles from "./page.module.css";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/chat");
      } else {
        router.push("/login");
      }
    }
  }, [user, loading, router]);

  return (
    <main className={styles.landing}>
      <div className={styles.glow} />
      <div className={styles.content}>
        <div className={styles.logoIcon}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="url(#grad)" />
            <path d="M14 28C14 22.477 18.477 18 24 18C29.523 18 34 22.477 34 28" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="24" cy="28" r="3" fill="white"/>
            <path d="M18 34H30" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="48" y2="48">
                <stop stopColor="#3B82F6"/>
                <stop offset="1" stopColor="#1D4ED8"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 className={styles.title}>
          AI Banking <span className="text-gradient">Advisor</span>
        </h1>
        <p className={styles.subtitle}>Loading your experience...</p>
        <div className={styles.loader}>
          <div className={styles.loaderDot} />
          <div className={styles.loaderDot} />
          <div className={styles.loaderDot} />
        </div>
      </div>
    </main>
  );
}
