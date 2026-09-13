"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import api from "@/lib/api";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Conversations tab state
  const [conversations, setConversations] = useState([]);
  const [convLoading, setConvLoading] = useState(false);
  const [convSearch, setConvSearch] = useState("");

  // Settings tab state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwError, setPwError] = useState("");

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

  // Load conversations when tab switches
  useEffect(() => {
    if (activeTab === "conversations" && user && conversations.length === 0) {
      loadConversations();
    }
  }, [activeTab, user]);

  const loadConversations = async () => {
    setConvLoading(true);
    try {
      const data = await api.getConversations(100, 0);
      setConversations(data.conversations || []);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setConvLoading(false);
    }
  };

  const handleDeleteConv = async (convId) => {
    try {
      await api.deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      toast.success("Conversation deleted permanently");
    } catch {
      toast.error("Failed to delete conversation");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwSuccess("");
    setPwError("");

    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setPwError("Password must be at least 8 characters");
      return;
    }

    setChangingPassword(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setPwSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwError(err.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleUpgrade = () => {
    toast.success("Pro plan coming soon! Stay tuned 🚀");
  };

  if (authLoading || !user) return null;

  const totalConvs = analytics?.total_conversations || 0;
  const totalMsgs = analytics?.total_messages || 0;

  const filteredConvs = conversations.filter((c) =>
    c.title.toLowerCase().includes(convSearch.toLowerCase())
  );

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
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          Overview
        </button>
        <button
          className={`${styles.tab} ${activeTab === "conversations" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("conversations")}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Conversations
        </button>
        <button
          className={`${styles.tab} ${activeTab === "settings" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          Settings
        </button>
      </div>

      {/* Content */}
      <main className={styles.content}>
        {/* ═══════════════════════ OVERVIEW TAB ═══════════════════════ */}
        {activeTab === "overview" && (
          <>
            {/* Stats Cards */}
            <div className={styles.statsGrid}>
              {/* Total Conversations */}
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Total Conversations</div>
                {loading ? (
                  <div className="skeleton" style={{ height: 40, width: 80, borderRadius: 8 }} />
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
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Top Banking Topics</div>
                {loading ? (
                  <div className="skeleton" style={{ height: 70, borderRadius: 8 }} />
                ) : analytics?.top_categories?.length > 0 ? (
                  <div className={styles.topicList}>
                    {analytics.top_categories.slice(0, 3).map((cat, i) => (
                      <div key={i} className={styles.topicItem}>
                        <span className={styles.topicIcon}>{getTopicIcon(cat.category)}</span>
                        <span>{formatCategoryName(cat.category)}</span>
                        <span className={styles.topicPercent}>{cat.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: "#7a8da6", fontSize: 14 }}>Start chatting to see topics</div>
                )}
              </div>

              {/* User Satisfaction */}
              <div className={styles.statCard}>
                <div className={styles.statLabel}>User Satisfaction</div>
                {loading ? (
                  <div className="skeleton" style={{ height: 40, width: 60, borderRadius: 8 }} />
                ) : totalConvs > 0 ? (
                  <>
                    <div className={styles.starRating}>
                      {"★★★★".split("").map((s, i) => (
                        <span key={i} className={styles.star}>{s}</span>
                      ))}
                      <span className={styles.starDim}>★</span>
                    </div>
                    <div className={styles.feedbackText}>Based on {totalConvs} conversation{totalConvs !== 1 ? "s" : ""}</div>
                  </>
                ) : (
                  <div style={{ color: "#7a8da6", fontSize: 14 }}>No feedback yet</div>
                )}
              </div>
            </div>

            {/* Two-column: Activity + Categories */}
            <div className={styles.twoCol}>
              {/* Activity Trends */}
              <div className={styles.panel}>
                <h2 className={styles.panelTitle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5a9cf5" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  Activity Trends (Last 30 Days)
                </h2>
                <div className={styles.chartArea}>
                  {loading ? (
                    <div className="skeleton" style={{ width: "100%", height: "100%", borderRadius: 10 }} />
                  ) : analytics?.recent_activity?.length > 0 ? (
                    <ActivityChart conversations={analytics.recent_activity} />
                  ) : (
                    <div className={styles.chartPlaceholder}>
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2a3a52" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                      <p style={{ marginTop: 10 }}>Activity data will appear here</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Popular Categories */}
              <div className={styles.panel}>
                <h2 className={styles.panelTitle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4A853" strokeWidth="2"><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/><path d="M12 3v9l4.5 4.5"/></svg>
                  Popular Categories
                </h2>
                {loading ? (
                  <div className="skeleton" style={{ height: 130, borderRadius: 10 }} />
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
                    <p className={styles.emptyHint}>Categories appear as you chat</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity — limited to 5 */}
            {analytics?.recent_activity?.length > 0 && (
              <div className={styles.panel}>
                <h2 className={styles.panelTitle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Recent Activity
                </h2>
                <div className={styles.activityList}>
                  {analytics.recent_activity.slice(0, 5).map((item, i) => (
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

        {/* ═══════════════════ CONVERSATIONS TAB ═══════════════════ */}
        {activeTab === "conversations" && (
          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5a9cf5" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              All Conversations
            </h2>

            {/* Search */}
            <div className={styles.convSearchBox}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                placeholder="Search conversations..."
                value={convSearch}
                onChange={(e) => setConvSearch(e.target.value)}
                className={styles.convSearchInput}
              />
            </div>

            {convLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 56, borderRadius: 10, marginBottom: 8 }} />
              ))
            ) : filteredConvs.length === 0 ? (
              <div className={styles.emptyPanel}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#3a4a62" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <p>{convSearch ? "No matching conversations" : "No conversations yet"}</p>
                <p className={styles.emptyHint}>Start chatting to see your conversation history here</p>
              </div>
            ) : (
              <div className={styles.convListPanel}>
                {filteredConvs.map((conv) => (
                  <div key={conv.id} className={styles.convRow} onClick={() => router.push(`/chat/${conv.id}`)}>
                    <div className={styles.convRowIcon}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </div>
                    <div className={styles.convRowInfo}>
                      <div className={styles.convRowTitle}>{conv.title}</div>
                      <div className={styles.convRowMeta}>
                        {conv.message_count} messages • {new Date(conv.updated_at || conv.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>
                    <button
                      className={styles.convDeleteBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConv(conv.id);
                      }}
                      title="Delete permanently"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════ SETTINGS TAB ═══════════════════════ */}
        {activeTab === "settings" && (
          <div className={styles.settingsGrid}>
            {/* Account Info */}
            <div className={styles.settingsSection}>
              <h3 className={styles.settingsSectionTitle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5a9cf5" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Account Information
              </h3>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Full Name</label>
                  <input
                    type="text"
                    className={styles.formInputDisabled}
                    value={user.full_name || ""}
                    disabled
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email</label>
                  <input
                    type="email"
                    className={styles.formInputDisabled}
                    value={user.email || ""}
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div className={styles.settingsSection}>
              <h3 className={styles.settingsSectionTitle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4A853" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Change Password
              </h3>
              <form onSubmit={handleChangePassword}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Current Password</label>
                  <input
                    type="password"
                    className={styles.formInput}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                  />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>New Password</label>
                    <input
                      type="password"
                      className={styles.formInput}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      required
                      minLength={8}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Confirm New Password</label>
                    <input
                      type="password"
                      className={styles.formInput}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      required
                    />
                  </div>
                </div>
                <button type="submit" className={styles.saveBtn} disabled={changingPassword}>
                  {changingPassword ? "Changing..." : "Update Password"}
                </button>
                {pwSuccess && <div className={styles.successMsg}>{pwSuccess}</div>}
                {pwError && <div className={styles.errorMsg}>{pwError}</div>}
              </form>
            </div>

            {/* Plan & Billing */}
            <div className={styles.settingsSection}>
              <h3 className={styles.settingsSectionTitle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                Plan & Billing
              </h3>
              <div className={styles.planCard}>
                <div className={styles.planInfo}>
                  <h3>You&apos;re on the Free Plan</h3>
                  <p>Unlimited conversations • AI banking advice • Basic analytics</p>
                  <div className={styles.planBadge}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    Active
                  </div>
                </div>
                <button className={styles.upgradeBtn} onClick={handleUpgrade}>
                  Upgrade to Pro
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


/* ═══════════════════ HELPER COMPONENTS ═══════════════════════ */

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

    const midAngle = ((startAngle + endAngle) / 2 - 90) * (Math.PI / 180);
    const labelR = radius + 14;
    const lx = cx + labelR * Math.cos(midAngle);
    const ly = cy + labelR * Math.sin(midAngle);

    return (
      <g key={i}>
        <path d={d} fill={DONUT_COLORS[i % DONUT_COLORS.length]} opacity="0.9" />
        {pct > 0.08 && (
          <text x={lx} y={ly} fill="#96a8c0" fontSize="10" fontWeight="600" textAnchor="middle" dominantBaseline="middle">
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
  const height = 180;
  const padding = 24;

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
          <stop offset="0%" stopColor="#5a9cf5" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#5a9cf5" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#areaGrad)" />
      <path d={pathD} fill="none" stroke="#5a9cf5" strokeWidth="2.5" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#5a9cf5" opacity="0.8" />
      ))}
    </svg>
  );
}


function getTopicIcon(category) {
  if (!category) return "💬";
  const lower = category.toLowerCase();
  const icons = {
    savings_account: "🏦",
    current_account: "💼",
    credit: "💳",
    home_loan: "🏠",
    car_financing: "🚗",
    investment: "📈",
    digital: "📱",
    general: "💬",
    triage_agent: "🤖",
    account_advisor: "💰",
    loan_advisor: "🏦",
    card_advisor: "💳",
  };
  // Try exact match first
  if (icons[lower]) return icons[lower];
  // Try partial match
  for (const [key, icon] of Object.entries(icons)) {
    if (lower.includes(key)) return icon;
  }
  return "💬";
}

function formatCategoryName(category) {
  if (!category) return "General";
  return category
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace("Triage Agent", "AI Advisor");
}
