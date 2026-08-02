"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    const fetchAnalytics = async () => {
      try {
        const data = await api.getAnalytics();
        setAnalytics(data);
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchAnalytics();
  }, [user, authLoading, router]);

  if (authLoading || !user) return null;

  return (
    <div className={styles.dashboardPage}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => router.push("/chat")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <div>
            <h1 className={styles.headerTitle}>Dashboard</h1>
            <p className={styles.headerSub}>Analytics & insights</p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.userPill}>
            <div className={styles.userAvatar}>
              {user.full_name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <span className={styles.userName}>{user.full_name}</span>
          </div>
          <button className="btn-ghost" onClick={logout}>Logout</button>
        </div>
      </header>

      {/* Content */}
      <main className={styles.content}>
        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          <StatCard
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
            label="Total Users"
            value={loading ? null : analytics?.total_users || 0}
            color="blue"
          />
          <StatCard
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
            label="Conversations"
            value={loading ? null : analytics?.total_conversations || 0}
            color="green"
          />
          <StatCard
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>}
            label="Messages"
            value={loading ? null : analytics?.total_messages || 0}
            color="purple"
          />
          <StatCard
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>}
            label="AI Agents Active"
            value={7}
            color="gold"
          />
        </div>

        {/* Two-column layout */}
        <div className={styles.twoCol}>
          {/* Popular Banks */}
          <div className={`card ${styles.panel}`}>
            <h2 className={styles.panelTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-gold)" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Most Recommended Banks
            </h2>
            {loading ? (
              <div className={styles.skeletonList}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton" style={{ height: 48, borderRadius: 8 }} />
                ))}
              </div>
            ) : analytics?.popular_banks?.length > 0 ? (
              <div className={styles.bankList}>
                {analytics.popular_banks.map((bank, i) => (
                  <div key={i} className={styles.bankItem}>
                    <div className={styles.bankRank}>{i + 1}</div>
                    <div className={styles.bankInfo}>
                      <span className={styles.bankName}>{bank.name}</span>
                      <span className={styles.bankCount}>{bank.count} recommendations</span>
                    </div>
                    <div className={styles.bankBar}>
                      <div
                        className={styles.bankBarFill}
                        style={{
                          width: `${(bank.count / (analytics.popular_banks[0]?.count || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyPanel}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <p>No recommendations yet</p>
                <p className={styles.emptyHint}>Start chatting to get bank recommendations</p>
              </div>
            )}
          </div>

          {/* Top Categories */}
          <div className={`card ${styles.panel}`}>
            <h2 className={styles.panelTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-blue)" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              Top Categories
            </h2>
            {loading ? (
              <div className={styles.skeletonList}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton" style={{ height: 48, borderRadius: 8 }} />
                ))}
              </div>
            ) : analytics?.top_categories?.length > 0 ? (
              <div className={styles.categoryList}>
                {analytics.top_categories.map((cat, i) => (
                  <div key={i} className={styles.categoryItem}>
                    <div className={styles.categoryIcon}>
                      {getCategoryIcon(cat.category)}
                    </div>
                    <div className={styles.categoryInfo}>
                      <span className={styles.categoryName}>
                        {cat.category?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "General"}
                      </span>
                      <span className={styles.categoryCount}>{cat.count} queries</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyPanel}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                <p>No category data yet</p>
                <p className={styles.emptyHint}>Categories appear as users ask questions</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className={`card ${styles.panel}`}>
          <h2 className={styles.panelTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-green)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Recent Activity
          </h2>
          {loading ? (
            <div className={styles.skeletonList}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8 }} />
              ))}
            </div>
          ) : analytics?.recent_activity?.length > 0 ? (
            <div className={styles.activityList}>
              {analytics.recent_activity.map((item, i) => (
                <div key={i} className={styles.activityItem}>
                  <div className={styles.activityDot} />
                  <div className={styles.activityInfo}>
                    <span className={styles.activityTitle}>{item.title}</span>
                    <span className={styles.activityMeta}>
                      {item.messages} messages • {new Date(item.date).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyPanel}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


function StatCard({ icon, label, value, color }) {
  const colorMap = {
    blue: { bg: "var(--color-accent-blue-subtle)", fg: "var(--color-accent-blue)" },
    green: { bg: "var(--color-accent-green-subtle)", fg: "var(--color-accent-green)" },
    purple: { bg: "var(--color-accent-purple-subtle)", fg: "var(--color-accent-purple)" },
    gold: { bg: "var(--color-accent-gold-subtle)", fg: "var(--color-accent-gold)" },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className={`card ${styles.statCard}`}>
      <div className={styles.statIcon} style={{ background: c.bg, color: c.fg }}>
        {icon}
      </div>
      <div className={styles.statInfo}>
        <span className={styles.statLabel}>{label}</span>
        {value === null ? (
          <div className="skeleton" style={{ height: 28, width: 60, borderRadius: 6 }} />
        ) : (
          <span className={styles.statValue}>{value.toLocaleString()}</span>
        )}
      </div>
    </div>
  );
}


function getCategoryIcon(category) {
  const icons = {
    savings_account: "💰",
    current_account: "🏦",
    credit: "💳",
    home_loan: "🏠",
    car_financing: "🚗",
    investment: "📈",
    digital: "📱",
  };
  // Use a simple colored dot instead of emoji (following anti-pattern rules)
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="var(--color-accent-blue)">
      <circle cx="4" cy="4" r="4"/>
    </svg>
  );
}
