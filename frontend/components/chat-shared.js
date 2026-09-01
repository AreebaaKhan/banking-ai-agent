/**
 * Shared utilities for chat pages — message bubble, markdown, AI state.
 */

"use client";

import { useState } from "react";
import styles from "../app/chat/chat-page.module.css";

export function emitAiState(state, message) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ai-companion-state", { detail: { state, message } }));
  }
}

export function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`${styles.messageRow} ${isUser ? styles.userRow : styles.assistantRow}`}>
      <div className={`${styles.avatar} ${isUser ? styles.userAvatar : styles.aiAvatar}`}>
        {isUser ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v.5A3.5 3.5 0 0 0 5.5 9c0 1.2.6 2.3 1.5 3A3.5 3.5 0 0 0 5.5 15 3.5 3.5 0 0 0 9 18.5V19a3 3 0 0 0 6 0v-.5A3.5 3.5 0 0 0 18.5 15a3.5 3.5 0 0 0-1-2.7A3.5 3.5 0 0 0 18.5 9 3.5 3.5 0 0 0 15 5.5V5a3 3 0 0 0-3-3z"/><line x1="12" y1="5" x2="12" y2="19"/></svg>
        )}
      </div>
      <div className={styles.bubbleWrapper}>
        {!isUser && message.agent_name && (
          <span className={styles.agentBadge}>{formatAgentName(message.agent_name)}</span>
        )}
        <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.aiBubble}`}>
          <div className="markdown-content" dangerouslySetInnerHTML={{ __html: simpleMarkdown(message.content) }} />
        </div>
        {!isUser && message.content && (
          <div className={styles.messageActions}>
            <button className={styles.actionBtn} onClick={handleCopy} title="Copy response">
              {copied ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
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

export function formatAgentName(name) {
  if (!name) return "";
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace("Triage Agent", "AI Advisor");
}

export function simpleMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
    .replace(/^# (.*$)/gm, "<h1>$1</h1>")
    .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/^\|(.+)\|$/gm, (match) => {
      const cells = match.split("|").filter(Boolean).map((c) => c.trim());
      if (cells.every((c) => /^[-:]+$/.test(c))) return "";
      return `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`;
    })
    .replace(/((?:<tr>.*<\/tr>\s*)+)/g, "<table>$1</table>")
    .replace(/^---$/gm, "<hr/>")
    .replace(/^[\-\*] (.*$)/gm, "<li>$1</li>")
    .replace(/((?:<li>.*<\/li>\s*)+)/g, "<ul>$1</ul>")
    .replace(/^\d+\. (.*$)/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>")
    .replace(/^(.+)/, "<p>$1</p>");
}
