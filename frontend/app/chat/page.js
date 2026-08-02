"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import styles from "./chat-page.module.css";

const SUGGESTIONS = [
  "Which bank is best for students?",
  "Compare HBL and Meezan Bank",
  "I want to open a savings account",
  "Best credit card for cashback?",
  "Guide me through getting a home loan",
  "Which bank has the best mobile app?",
];

export default function NewChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [currentAgent, setCurrentAgent] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (text = null) => {
    const msgText = text || message.trim();
    if (!msgText || streaming) return;

    setMessage("");
    const userMsg = { role: "user", content: msgText, id: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);

    // Create assistant placeholder
    const assistantId = Date.now() + 1;
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", id: assistantId, agent_name: null },
    ]);

    try {
      const response = await api.sendMessageStream(msgText, null);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let conversationId = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === "conversation_id") {
              conversationId = data.id;
            } else if (data.type === "content") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + data.content }
                    : m
                )
              );
            } else if (data.type === "agent_name") {
              setCurrentAgent(data.name);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, agent_name: data.name } : m
                )
              );
            } else if (data.type === "done") {
              // Navigate to the conversation
              if (conversationId) {
                window.__refreshConversations?.();
                router.push(`/chat/${conversationId}`);
              }
            } else if (data.type === "error") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: data.content } : m
                )
              );
            }
          } catch {}
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Sorry, I encountered an error. Please try again." }
            : m
        )
      );
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Show welcome screen if no messages
  if (messages.length === 0) {
    return (
      <div className={styles.chatContainer}>
        <div className={styles.welcomeScreen}>
          <div className={styles.welcomeGlow} />
          <div className={styles.welcomeIcon}>
            <svg width="56" height="56" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="16" fill="url(#wg)" />
              <path d="M14 28C14 22.477 18.477 18 24 18C29.523 18 34 22.477 34 28" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="24" cy="28" r="3" fill="white"/>
              <path d="M18 34H30" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <defs><linearGradient id="wg" x1="0" y1="0" x2="48" y2="48"><stop stopColor="#3B82F6"/><stop offset="1" stopColor="#1D4ED8"/></linearGradient></defs>
            </svg>
          </div>
          <h1 className={styles.welcomeTitle}>
            Hello, <span className="text-gradient">{user?.full_name?.split(" ")[0] || "there"}</span>
          </h1>
          <p className={styles.welcomeSubtitle}>
            I&apos;m your AI Banking Advisor. Ask me anything about Pakistani banks, accounts, cards, loans, or investments.
          </p>

          <div className={styles.suggestions}>
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                className={styles.suggestionChip}
                onClick={() => handleSend(s)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className={styles.inputArea}>
          <div className={styles.inputWrapper}>
            <textarea
              ref={inputRef}
              className={styles.chatInput}
              placeholder="Ask me about banking in Pakistan..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              className={styles.sendBtn}
              onClick={() => handleSend()}
              disabled={!message.trim() || streaming}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
          <p className={styles.disclaimer}>AI Banking Advisor provides general guidance. Consult your bank for official advice.</p>
        </div>
      </div>
    );
  }

  // Streaming view with messages
  return (
    <div className={styles.chatContainer}>
      <div className={styles.messagesArea}>
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {streaming && (
          <div className={styles.typingRow}>
            <div className={styles.typingIndicator}>
              <span /><span /><span />
            </div>
            {currentAgent && (
              <span className={styles.agentLabel}>{formatAgentName(currentAgent)}</span>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputArea}>
        <div className={styles.inputWrapper}>
          <textarea
            ref={inputRef}
            className={styles.chatInput}
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className={styles.sendBtn}
            onClick={() => handleSend()}
            disabled={!message.trim() || streaming}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}


function MessageBubble({ message }) {
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a4 4 0 0 1 4 4v2h2a2 2 0 0 1 2 2v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-8a2 2 0 0 1 2-2h2V6a4 4 0 0 1 4-4z"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/></svg>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-green)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


function formatAgentName(name) {
  if (!name) return "";
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace("Triage Agent", "AI Advisor");
}


function simpleMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    // Headers
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
    .replace(/^# (.*$)/gm, "<h1>$1</h1>")
    // Code blocks
    .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
    // Inline code
    .replace(/`(.*?)`/g, "<code>$1</code>")
    // Tables
    .replace(/^\|(.+)\|$/gm, (match) => {
      const cells = match.split("|").filter(Boolean).map((c) => c.trim());
      if (cells.every((c) => /^[-:]+$/.test(c))) return "";
      const tag = "td";
      return `<tr>${cells.map((c) => `<${tag}>${c}</${tag}>`).join("")}</tr>`;
    })
    .replace(/(<tr>[\s\S]*?<\/tr>)/g, (match) => {
      if (match.includes("<tr></tr>")) return match.replace("<tr></tr>", "");
      return match;
    })
    .replace(/((?:<tr>.*<\/tr>\s*)+)/g, "<table>$1</table>")
    // Horizontal rule
    .replace(/^---$/gm, "<hr/>")
    // Unordered lists
    .replace(/^[\-\*] (.*$)/gm, "<li>$1</li>")
    .replace(/((?:<li>.*<\/li>\s*)+)/g, "<ul>$1</ul>")
    // Numbered lists
    .replace(/^\d+\. (.*$)/gm, "<li>$1</li>")
    // Line breaks
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>")
    .replace(/^(.+)/, "<p>$1</p>");
}
