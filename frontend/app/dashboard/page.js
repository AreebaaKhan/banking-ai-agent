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

  return (
    <div className={styles.dashboardPage}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => router.push("/chat")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <h1 className={styles.headerTitle}>Banking Advisor Dashboard</h1>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.userPill}>
            <div className={styles.userAvatar}>
              {user.full_name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <span className={styles.userName}>{user.full_name}</span>
          </div>
          <button className={styles.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </header>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "overview" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          Overview
        </button>
        <button
          className={`${styles.tab} ${activeTab === "conversations" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("conversations")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Conversations
        </button>
        <button
          className={`${styles.tab} ${activeTab === "settings" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          Settings
        </button>
      </div>

      {/* Content */}
      <main className={styles.content}>
        {activeTab === "overview" && (
          <>
            {/* Stats Cards */}
            <div className={styles.statsGrid}>
              {/* Total Conversations */}
              <div className={`${styles.statCard} stagger-item`} style={{ "--stagger-delay": "100ms" }}>
                <div className={styles.statLabel}>Total Conversations</div>
                {loading ? (
                  <div className="skeleton" style={{ height: 36, width: 80, borderRadius: 6 }} />
                ) : (
                  <>
                    <div className={styles.statValue}>{totalConvs.toLocaleString()}</div>
                    {totalConvs > 0 && (
                      <div className={styles.statGrowth}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
                        Active
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Top Banking Topics */}
              <div className={`${styles.statCard} stagger-item`} style={{ "--stagger-delay": "200ms" }}>
                <div className={styles.statLabel}>Top Banking Topics</div>
                {loading ? (
                  <div className="skeleton" style={{ height: 60, borderRadius: 6 }} />
                ) : analytics?.top_categories?.length > 0 ? (
                  <div className={styles.topicList}>
                    {analytics.top_categories.slice(0, 3).map((cat, i) => (
                      <div key={i} className={styles.topicItem}>
                        <span className={styles.topicIcon}>{getTopicIcon(cat.category)}</span>
                        <span>{formatCategoryName(cat.category)}</span>
                        <span className={styles.topicPercent}>({cat.count})</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: "#4a5a72", fontSize: 13 }}>No data yet</div>
                )}
              </div>

              {/* User Satisfaction */}
              <div className={`${styles.statCard} stagger-item`} style={{ "--stagger-delay": "300ms" }}>
                <div className={styles.statLabel}>User Satisfaction</div>
                {loading ? (
                  <div className="skeleton" style={{ height: 36, width: 60, borderRadius: 6 }} />
                ) : totalConvs > 0 ? (
                  <>
                    <div className={styles.statValue}>{totalMsgs > 0 ? "—" : "—"}</div>
                    <div className={styles.feedbackText}>Not enough data yet</div>
                  </>
                ) : (
                  <div style={{ color: "#4a5a72", fontSize: 13 }}>No feedback yet</div>
                )}
              </div>
            </div>

            {/* Two-column: Activity + Categories */}
            <div className={styles.twoCol}>
              {/* Activity Trends */}
              <div className={`${styles.panel} stagger-item`} style={{ "--stagger-delay": "400ms" }}>
                <h2 className={styles.panelTitle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5a9cf5" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  Activity Trends (Last 30 Days)
                </h2>
                <div className={styles.chartArea}>
                  {loading ? (
                    <div className="skeleton" style={{ width: "100%", height: "100%", borderRadius: 8 }} />
                  ) : totalConvs > 0 ? (
                    <ActivityChart conversations={analytics?.recent_activity || []} />
                  ) : (
                    <div className={styles.chartPlaceholder}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2a3a52" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                      <p style={{ marginTop: 8 }}>Activity data will appear here</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Popular Categories */}
              <div className={`${styles.panel} stagger-item`} style={{ "--stagger-delay": "500ms" }}>
                <h2 className={styles.panelTitle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4A853" strokeWidth="2"><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/><path d="M12 3v9l4.5 4.5"/></svg>
                  Popular Categories
                </h2>
                {loading ? (
                  <div className="skeleton" style={{ height: 120, borderRadius: 8 }} />
                ) : analytics?.top_categories?.length > 0 ? (
                  <div className={styles.categoryDonut}>
                    <DonutChart categories={analytics.top_categories} />
                    <div className={styles.categoryLegend}>
                      {analytics.top_categories.slice(0, 5).map((cat, i) => (
                        <div key={i} className={styles.legendItem}>
                          <span className={styles.legendDot} style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                          <span>{formatCategoryName(cat.category)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={styles.emptyPanel}>
                    <p>No category data yet</p>
                    <p className={styles.emptyHint}>Categories appear as users ask questions</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            {analytics?.recent_activity?.length > 0 && (
              <div className={`${styles.panel} stagger-item`} style={{ "--stagger-delay": "600ms" }}>
                <h2 className={styles.panelTitle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Recent Activity
                </h2>
                <div className={styles.activityList}>
                  {analytics.recent_activity.slice(0, 6).map((item, i) => (
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
              </div>
            )}
          </>
        )}

        {activeTab === "conversations" && (
          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>All Conversations</h2>
            <div className={styles.emptyPanel}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3a4a62" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <p>View and manage all conversations</p>
              <button
                onClick={() => router.push("/chat")}
                style={{
                  marginTop: 12,
                  padding: "8px 20px",
                  background: "linear-gradient(135deg, #1a3a6a 0%, #15305a 100%)",
                  border: "1px solid rgba(90, 156, 245, 0.25)",
                  borderRadius: 8,
                  color: "#a8c8f0",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Go to Chat
              </button>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Settings</h2>
            <div className={styles.emptyPanel}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3a4a62" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.77 1.05 1.39 1.22l.12.04H21a2 2 0 0 1 0 4h-.09"/></svg>
              <p>Settings will be available soon</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


const DONUT_COLORS = ["#5a9cf5", "#7ac0c0", "#D4A853", "#8b7bf5", "#6a8a6a"];

function DonutChart({ categories }) {
  const total = categories.reduce((sum, c) => sum + c.count, 0);
  if (total === 0) return null;

  let currentAngle = 0;
  const radius = 50;
  const cx = 60;
  const cy = 60;
  const innerRadius = 30;

  const arcs = categories.slice(0, 5).map((cat, i) => {
    const pct = cat.count / total;
    const angle = pct * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);
    const ix1 = cx + innerRadius * Math.cos(endRad);
    const iy1 = cy + innerRadius * Math.sin(endRad);
    const ix2 = cx + innerRadius * Math.cos(startRad);
    const iy2 = cy + innerRadius * Math.sin(startRad);

    const largeArc = angle > 180 ? 1 : 0;

    const d = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;

    // Label position
    const midAngle = ((startAngle + endAngle) / 2 - 90) * (Math.PI / 180);
    const labelR = radius + 12;
    const lx = cx + labelR * Math.cos(midAngle);
    const ly = cy + labelR * Math.sin(midAngle);

    return (
      <g key={i}>
        <path d={d} fill={DONUT_COLORS[i % DONUT_COLORS.length]} opacity="0.85" />
        {pct > 0.08 && (
          <text x={lx} y={ly} fill="#6a7a94" fontSize="9" textAnchor="middle" dominantBaseline="middle">
            {Math.round(pct * 100)}%
          </text>
        )}
      </g>
    );
  });

  return (
    <svg className={styles.donutChart} viewBox="0 0 120 120">
      {arcs}
    </svg>
  );
}


function ActivityChart({ conversations }) {
  if (!conversations || conversations.length === 0) return null;

  const width = 400;
  const height = 160;
  const padding = 20;

  // Create simple points from recent activity
  const points = conversations.slice(0, 10).reverse().map((c, i) => ({
    x: padding + (i / Math.max(conversations.length - 1, 1)) * (width - padding * 2),
    y: height - padding - (c.messages / Math.max(...conversations.map(cc => cc.messages), 1)) * (height - padding * 2),
  }));

  if (points.length < 2) return null;

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = pathD + ` L ${points[points.length-1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5a9cf5" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#5a9cf5" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#areaGrad)" />
      <path d={pathD} fill="none" stroke="#5a9cf5" strokeWidth="2" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#5a9cf5" opacity="0.7" />
      ))}
    </svg>
  );
}


function getTopicIcon(category) {
  const icons = {
    savings_account: "🏦",
    current_account: "💼",
    credit: "💳",
    home_loan: "🏠",
    car_financing: "🚗",
    investment: "📈",
    digital: "📱",
    general: "💬",
  };
  return icons[category] || "💬";
}

function formatCategoryName(category) {
  if (!category) return "General";
  return category
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
