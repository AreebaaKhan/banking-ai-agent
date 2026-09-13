"use client";

import { useState } from "react";
import { simpleMarkdown, detectQuickReplies, formatAgentName, getInitials } from "@/lib/chat-utils";
import QuickReplies from "@/components/QuickReplies";
import styles from "@/app/chat/chat-page.module.css";

/**
 * MessageBubble — shared component for rendering chat messages.
 *
 * Used by both chat/page.js (new chat) and chat/[id]/page.js (active chat).
 * Extracted to eliminate duplication (Handoff Report §3.2, Issue #1).
 */
export default function MessageBubble({ message, onSend, streaming, isLast = true, userName }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [quickRepliesUsed, setQuickRepliesUsed] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Detect quick-reply options in AI messages
  // For [id] page: only show on last message. For new chat page: show on all (isLast defaults to true).
  const quickOptions = !isUser && isLast && !streaming && !quickRepliesUsed
    ? detectQuickReplies(message.content)
    : null;

  const handleQuickReply = (text) => {
    setQuickRepliesUsed(true);
    onSend(text);
  };

  return (
    <div className={`${styles.messageRow} ${isUser ? styles.userRow : styles.assistantRow}`}>
      <div className={`${styles.avatar} ${isUser ? styles.userAvatar : styles.aiAvatar}`}>
        {isUser ? (
          <span className={styles.avatarInitial}>{getInitials(userName)}</span>
        ) : (
          <img src="/images/brand-icon.png" alt="AI" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
        )}
      </div>
      <div className={styles.bubbleWrapper}>
        {!isUser && message.agent_name && (
          <span className={styles.agentBadge}>{formatAgentName(message.agent_name)}</span>
        )}
        <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.aiBubble}`}>
          <div className="markdown-content" dangerouslySetInnerHTML={{ __html: simpleMarkdown(message.content) }} />
        </div>

        {/* Quick reply options */}
        {quickOptions && (
          <QuickReplies
            options={quickOptions}
            onSelect={handleQuickReply}
            disabled={streaming}
          />
        )}

        {!isUser && message.content && (
          <div className={styles.messageActions}>
            <button className={styles.actionBtn} onClick={handleCopy} title="Copy response">
              {copied ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
