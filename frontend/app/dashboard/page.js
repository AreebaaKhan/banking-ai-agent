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
  const [activeTab, setActiveTab] = useState("overview");

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

  const totalConvs = analytics?.total_conversations || 0;
  const totalMsgs = analytics?.total_messages || 0;
  const totalUsers = analytics?.total_users || 0;
  const topBanks = analytics?.popular_banks || [];
  const topCategories = analytics?.top_categories || [];
  const recentActivity = analytics?.recent_activity || [];

  return (
    <div className={styles.dashboardPage}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => router.push("/chat")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <h1 className={styles.headerTitle}>Banking Advisor Dashboard</h1>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.userAvatar}>
            {user.full_name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <button className={styles.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </header>

      {/* Tabs */}
      <nav className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === "overview" ? styles.tabActive : ""}`} onClick={() => setActiveTab("overview")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          Overview
        </button>
        <button className={`${styles.tab} ${activeTab === "conversations" ? styles.tabActive : ""}`} onClick={() => setActiveTab("conversations")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Conversations
        </button>
        <button className={`${styles.tab} ${activeTab === "settings" ? styles.tabActive : ""}`} onClick={() => setActiveTab("settings")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.!!65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          Settings
        </button>
      </nav>

      {/* Content */}
      <main className={styles.content}>
        {activeTab === "overview" && (
          <>
            {/* Top Row — 3 cards */}
            <div className={styles.statsGrid}>
              {/* Total Conversations */}
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.statLabel}>Total Conversations</span>
                  <div className={styles.statIcon}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                </div>
                {loading ? (
                  <div className="skeleton" style={{ height: 28, width: 80, borderRadius: 6 }} />
                ) : (
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                    <span className={styles.statValue}>{totalConvs.toLocaleString()}</span>
                    {totalConvs > 0 && (
                      <span className={styles.statBadge}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15"/></svg>
                        Active
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Top Banking Topics */}
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.statLabel}>Top Banking Topics</span>
                  <div className={styles.statIcon}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                  </div>
                </div>
                {loading ? (
                  <div className={styles.skeletonList}>
                    {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 20, borderRadius: 4 }} />)}
                  </div>
                ) : topCategories.length > 0 ? (
                  topCategories.slice(0, 3).map((cat, i) => {
                    const total = topCategories.reduce((s, c) => s + c.count, 0) || 1;
                    const pct = Math.round((cat.count / total) * 100);
                    const colors = ["#5c8fdc", "#46979e", "#63a9b3"];
                    return (
                      <div key={i} className={styles.topicItem}>
                        <div className={styles.topicDot} style={{ background: colors[i] || "#5c8fdc" }} />
                        <span className={styles.topicName}>
                          {(cat.category || "General").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </span>
                        <span className={styles.topicPct}>{pct}%</span>
                      </div>
                    );
                  })
                ) : (
                  <div className={styles.emptyPanel}><p>No topics yet</p></div>
                )}
              </div>

              {/* User Satisfaction */}
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.statLabel}>User Satisfaction</span>
                  <div className={styles.statIcon}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  </div>
                </div>
                {loading ? (
                  <div className="skeleton" style={{ height: 28, width: 60, borderRadius: 6 }} />
                ) : totalMsgs > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    <span className={styles.statValue}>{totalUsers} Users</span>
                    <div className={styles.stars}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill={s <= 4 ? "#f5c518" : "none"} stroke={s <= 4 ? "#f5c518" : "#3d4655"} strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      ))}
                    </div>
                    <span style={{ fontSize: "0.7rem", color: "#a0aec0" }}>{totalMsgs.toLocaleString()} total messages</span>
                  </div>
                ) : (
                  <div className={styles.emptyPanel}><p>No data yet</p></div>
                )}
              </div>
            </div>

            {/* Bottom Row — charts */}
            <div className={styles.twoCol}>
              {/* Activity Trends */}
              <div className={styles.panel}>
                <h2 className={styles.panelTitle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5c8fdc" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  Activity Trends
                </h2>
                {loading ? (
                  <div className="skeleton" style={{ height: 180, borderRadius: 8 }} />
                ) : recentActivity.length > 0 ? (
                  <ActivityChart data={recentActivity} />
                ) : (
                  <div className={styles.emptyPanel}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                    <p>No analytics available yet</p>
                    <p className={styles.emptyHint}>Start chatting to see activity trends</p>
                  </div>
                )}
              </div>

              {/* Popular Categories */}
              <div className={styles.panel}>
                <h2 className={styles.panelTitle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5c8fdc" strokeWidth="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
                  Popular Categories
                </h2>
                {loading ? (
                  <div className="skeleton" style={{ height: 180, borderRadius: 8 }} />
                ) : topCategories.length > 0 ? (
                  <DonutChart data={topCategories} />
                ) : (
                  <div className={styles.emptyPanel}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
                    <p>No categories yet</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === "conversations" && (
          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Recent Conversations</h2>
            {loading ? (
              <div className={styles.skeletonList}>
                {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8 }} />)}
              </div>
            ) : recentActivity.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {recentActivity.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.5rem 0.625rem", borderRadius: 8, background: "rgba(255,255,255,0.02)" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#48bb78", flexShrink: 0 }} />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "0.8125rem", color: "#e5e7eb" }}>{item.title}</span>
                      <span style={{ fontSize: "0.7rem", color: "#6b7689" }}>{item.messages} messages · {new Date(item.date).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyPanel}><p>No conversations yet</p></div>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Settings</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", borderRadius: 8, background: "rgba(255,255,255,0.02)" }}>
                <div><span style={{ fontSize: "0.8125rem", color: "#e5e7eb", fontWeight: 500 }}>Account Email</span><br /><span style={{ fontSize: "0.75rem", color: "#6b7689" }}>{user.email}</span></div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", borderRadius: 8, background: "rgba(255,255,255,0.02)" }}>
                <div><span style={{ fontSize: "0.8125rem", color: "#e5e7eb", fontWeight: 500 }}>Full Name</span><br /><span style={{ fontSize: "0.75rem", color: "#6b7689" }}>{user.full_name}</span></div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", borderRadius: 8, background: "rgba(255,255,255,0.02)" }}>
                <div><span style={{ fontSize: "0.8125rem", color: "#e5e7eb", fontWeight: 500 }}>AI Model</span><br /><span style={{ fontSize: "0.75rem", color: "#6b7689" }}>LLaMA 3.3 70B (Groq)</span></div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ─── SVG Charts ─────────────────────────────────────────────── */

function ActivityChart({ data }) {
  const values = data.map((d) => d.messages || 0);
  const maxVal = Math.max(...values, 1);
  const w = 400;
  const h = 160;
  const padding = 20;
  const points = values.map((v, i) => {
    const x = padding + (i / Math.max(values.length - 1, 1)) * (w - padding * 2);
    const y = h - padding - (v / maxVal) * (h - padding * 2);
    return { x, y, val: v };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1]?.x || padding} ${h - padding} L ${padding} ${h - padding} Z`;

  return (
    <div className={styles.chartContainer}>
      <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5c8fdc" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#5c8fdc" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#areaGrad)" />
        <path d={pathD} fill="none" stroke="#5c8fdc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#5c8fdc" />
        ))}
      </svg>
    </div>
  );
}

function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  const colors = ["#5c8fdc", "#46979e", "#63a9b3", "#8b5cf6", "#d4af37"];
  let offset = 0;
  const radius = 50;
  const stroke = 12;
  const circumference = 2 * Math.PI * radius;

  const segments = data.slice(0, 5).map((d, i) => {
    const pct = d.count / total;
    const dash = pct * circumference;
    const seg = { color: colors[i], dash, offset, pct, name: d.category || "Other" };
    offset += dash;
    return seg;
  });

  return (
    <div className={styles.donutContainer}>
      <div className={styles.donut}>
        <svg width="130" height="130" viewBox="0 0 130 130">
          <circle cx="65" cy="65" r={radius} fill="none" stroke="#1f2a44" strokeWidth={stroke} />
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx="65"
              cy="65"
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
              strokeDashoffset={-seg.offset}
              transform="rotate(-90 65 65)"
            />
          ))}
        </svg>
        <div className={styles.donutCenter}>
          <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff" }}>{total}</div>
          <div style={{ fontSize: "0.65rem", color: "#6b7689" }}>Total</div>
        </div>
      </div>
      <div className={styles.donutLegend}>
        {segments.map((seg, i) => (
          <div key={i} className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: seg.color }} />
            <span>{seg.name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>
            <span style={{ marginLeft: "auto", fontWeight: 500 }}>{Math.round(seg.pct * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
