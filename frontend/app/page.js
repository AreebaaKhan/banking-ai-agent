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
      <div className={styles.overlay} />
      <div className={styles.content}>
        <div className={styles.logoIcon}>
          <img src="/images/brand-icon.png" alt="AI Banking Advisor" width={56} height={56} />
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
