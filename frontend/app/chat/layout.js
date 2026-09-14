"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import api from "@/lib/api";
import styles from "./chat-layout.module.css";

export default function ChatLayout({ children }) {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  const [conversations, setConversations] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [dragging, setDragging] = useState(false);
  const dragState = useRef(null);

  const activeConvId = pathname.startsWith("/chat/") ? pathname.split("/chat/")[1] : null;

  // Restore saved width and handle initial mobile state
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        const saved = localStorage.getItem("sidebarWidth");
        if (saved) setSidebarWidth(Number(saved));
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("sidebarWidth", String(sidebarWidth));
  }, [sidebarWidth]);

  const closeSidebarOnMobile = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

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
    window.dispatchEvent(new Event("reset-chat"));
    closeSidebarOnMobile();
    router.push("/chat");
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

  // Drag-to-resize
  const handleDragStart = (e) => {
    e.preventDefault();
    setDragging(true);
    dragState.current = {
      startX: e.clientX,
      startWidth: sidebarWidth,
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (ev) => {
      if (!dragState.current) return;
      const delta = ev.clientX - dragState.current.startX;
      const next = Math.min(Math.max(dragState.current.startWidth + delta, 220), 400);
      setSidebarWidth(next);
    };
    const handleUp = () => {
      setDragging(false);
      dragState.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
  }, [dragging]);

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
      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}
        style={{ width: sidebarOpen ? sidebarWidth : 0 }}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarTopRow}>
            <span className={styles.sidebarBrand}>
              <svg
                className={styles.sidebarBrandIcon}
                width="30"
                height="25"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#5a9cf5"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 21h18" />
                <path d="M5 21V10l7-5 7 5v11" />
                <path d="M9 21v-8h6v8" />
                <path d="M3 10h18" />
              </svg>
              <span>AI Banking Advisor</span>
            </span>
            <button
              className={styles.sidebarCloseBtn}
              onClick={() => setSidebarOpen(false)}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          </div>
          <button className={styles.newChatBtn} onClick={handleNewChat} title="New conversation">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Chat
          </button>
        </div>

        <div className={styles.searchBox}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.convList}>
          <div className={styles.convListLabel}>Recent Conversations</div>

          {loadingConvs ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`skeleton ${styles.convSkeleton}`} />
            ))
          ) : filteredConversations.length === 0 ? (
            <div className={styles.emptyState}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#5a6a82" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
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
                    onClick={() => {
                      closeSidebarOnMobile();
                      router.push(`/chat/${conv.id}`);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        closeSidebarOnMobile();
                        router.push(`/chat/${conv.id}`);
                      }
                    }}
                  >
                    <div className={styles.convTitle}>{conv.title}</div>
                    <div className={styles.convMeta}>
                      <span>{conv.message_count} messages</span>
                      <button className={styles.deleteBtn} onClick={(e) => handleDeleteConv(conv.id, e)} title="Delete">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        <div className={styles.sidebarFooter}>
          <button onClick={() => { closeSidebarOnMobile(); router.push("/dashboard"); }} className={styles.footerBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            Dashboard
          </button>
          <button onClick={() => { closeSidebarOnMobile(); logout(); }} className={styles.footerBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>

        {/* Drag handle */}
        {sidebarOpen && (
          <div
            className={`${styles.resizeHandle} ${dragging ? styles.resizeHandleDragging : ""}`}
            onMouseDown={handleDragStart}
            title="Drag to resize"
          />
        )}
      </aside>

      {/* Desktop open button when collapsed */}
      {!sidebarOpen && (
        <button className={styles.openBtn} onClick={() => setSidebarOpen(true)} title="Open sidebar" aria-label="Open sidebar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      )}

      {/* Mobile toggle */}
      <button
        className={styles.mobileToggle}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        title={sidebarOpen ? "Close sidebar" : "Open menu"}
        aria-label={sidebarOpen ? "Close sidebar" : "Open menu"}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {sidebarOpen ? (
            <path d="M18 6L6 18M6 6l12 12" />
          ) : (
            <path d="M3 12h18M3 6h18M3 18h18" />
          )}
        </svg>
      </button>

      {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

      <main className={styles.mainContent}>
        {children}
      </main>
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