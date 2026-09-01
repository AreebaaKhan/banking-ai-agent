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
            <path d="M24 8a4 4 0 0 0-4 4v.5a5 5 0 0 0-5 5c0 1.7.9 3.3 2 4a5 5 0 0 0-2 4 5 5 0 0 0 5 5v.5a4 4 0 0 0 8 0V30.5a5 5 0 0 0 5-5 5 5 0 0 0-2-4 5 5 0 0 0 2-4 5 5 0 0 0-5-5V12a4 4 0 0 0-4-4z" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <line x1="24" y1="12" x2="24" y2="36" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="48" y2="48">
                <stop stopColor="#5c8fdc"/>
                <stop offset="1" stopColor="#2b5c9e"/>
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
