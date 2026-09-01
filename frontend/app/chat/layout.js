"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import api from "@/lib/api";
import AiCompanion from "@/components/AiCompanion";
import styles from "./chat-layout.module.css";

export default function ChatLayout({ children }) {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  const [conversations, setConversations] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);

  const activeConvId = pathname.startsWith("/chat/") ? pathname.split("/chat/")[1] : null;

  const fetchConversations = useCallback(async () => {
    try {
      const data = await api.getConversations();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchConversations();
  }, [user, fetchConversations]);

  useEffect(() => {
    window.__refreshConversations = fetchConversations;
    return () => { delete window.__refreshConversations; };
  }, [fetchConversations]);

  const handleNewChat = () => {
    router.push("/chat");
    setSidebarOpen(false);
  };

  const handleDeleteConv = async (convId, e) => {
    e.stopPropagation();
    try {
      await api.deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConvId === convId) router.push("/chat");
      toast.success("Conversation deleted");
    } catch {
      toast.error("Failed to delete conversation");
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const grouped = groupByDate(filteredConversations);

  if (authLoading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={styles.chatLayout}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoRow}>
            <div className={styles.logoIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v.5A3.5 3.5 0 0 0 5.5 9c0 1.2.6 2.3 1.5 3A3.5 3.5 0 0 0 5.5 15 3.5 3.5 0 0 0 9 18.5V19a3 3 0 0 0 6 0v-.5A3.5 3.5 0 0 0 18.5 15a3.5 3.5 0 0 0-1-2.7A3.5 3.5 0 0 0 18.5 9 3.5 3.5 0 0 0 15 5.5V5a3 3 0 0 0-3-3z"/>
                <line x1="12" y1="5" x2="12" y2="19"/>
              </svg>
            </div>
            <span className={styles.logoText}>Banking Advisor</span>
          </div>
          <button className={styles.newChatBtn} onClick={handleNewChat}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Chat
          </button>
        </div>

        <div className={styles.searchBox}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.convListSection}>
          <div className={styles.convListHeader}>Recent Conversations</div>
          {loadingConvs ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`skeleton ${styles.convSkeleton}`} />
            ))
          ) : filteredConversations.length === 0 ? (
            <div className={styles.emptyState}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <p>No conversations yet</p>
              <p className={styles.emptyHint}>Start a new chat to get banking advice</p>
            </div>
          ) : (
            Object.entries(grouped).map(([dateLabel, convs]) => (
              <div key={dateLabel} className={styles.dateGroup}>
                <div className={styles.dateLabel}>{dateLabel}</div>
                {convs.map((conv) => (
                  <div
                    key={conv.id}
                    role="button"
                    tabIndex={0}
                    className={`${styles.convItem} ${activeConvId === conv.id ? styles.convActive : ""}`}
                    onClick={() => { router.push(`/chat/${conv.id}`); setSidebarOpen(false); }}
                    onKeyDown={(e) => e.key === "Enter" && router.push(`/chat/${conv.id}`)}
                  >
                    <div className={styles.convTitle}>{conv.title}</div>
                    <div className={styles.convMeta}>
                      <span>{conv.message_count} messages</span>
                      <button
                        className={styles.deleteBtn}
                        onClick={(e) => handleDeleteConv(conv.id, e)}
                        title="Delete"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        <div className={styles.sidebarFooter}>
          <button onClick={() => router.push("/dashboard")} className={styles.footerBtn}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            Dashboard
          </button>
          <button onClick={logout} className={styles.footerBtn}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>
      </aside>

      <button
        className={styles.mobileToggle}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>

      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className={styles.mainContent}>
        {children}
      </main>

      {/* AI Companion Panel */}
      <aside className={styles.companionPanel}>
        <AiCompanion />
      </aside>
    </div>
  );
}

function groupByDate(conversations) {
  const groups = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  for (const conv of conversations) {
    const date = new Date(conv.updated_at || conv.created_at);
    let label;
    if (date >= today) label = "Today";
    else if (date >= yesterday) label = "Yesterday";
    else if (date >= weekAgo) label = "This Week";
    else label = "Older";

    if (!groups[label]) groups[label] = [];
    groups[label].push(conv);
  }
  return groups;
}
