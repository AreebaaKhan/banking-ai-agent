"use client";

import { useState, useRef, useEffect, use } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import styles from "../chat-page.module.css";
import AiCompanion from "@/components/AiCompanion";
import QuickReplies from "@/components/QuickReplies";

export default function ConversationPage({ params }) {
  const resolvedParams = use(params);
  const conversationId = resolvedParams.id;
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [currentAgent, setCurrentAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [companionStatus, setCompanionStatus] = useState("idle");
  const [lang, setLang] = useState("EN");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Load conversation messages
  useEffect(() => {
    const loadConversation = async () => {
      try {
        const data = await api.getConversation(conversationId);
        setMessages(
          (data.messages || []).map((m, i) => ({
            ...m,
            id: m.id || i,
          }))
        );
        setTitle(data.title || "Conversation");
      } catch (err) {
        console.error("Failed to load conversation:", err);
      } finally {
        setLoading(false);
      }
    };

    if (conversationId) loadConversation();
  }, [conversationId]);

  const handleSend = async (text = null) => {
    const msgText = text || message.trim();
    if (!msgText || streaming) return;

    setMessage("");
    const userMsg = { role: "user", content: msgText, id: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);
    setCompanionStatus("thinking");

    const assistantId = Date.now() + 1;
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", id: assistantId, agent_name: null },
    ]);

    try {
      const response = await api.sendMessageStream(msgText, conversationId);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      setCompanionStatus("streaming");

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

            if (data.type === "content") {
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
              window.__refreshConversations?.();
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
      setCompanionStatus("done");
      setTimeout(() => setCompanionStatus("idle"), 5000);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className={styles.chatContainer}>
        <div className={styles.chatColumn}>
          <div className={styles.chatHeader}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5a9cf5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V10l7-5 7 5v11"/><path d="M9 21v-8h6v8"/><path d="M3 10h18"/></svg>
            <span className={styles.chatHeaderTitle}>AI Banking Advisor</span>
          </div>
          <div className={styles.messagesArea}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={styles.messageRow} style={{ maxWidth: 700, margin: "0 auto" }}>
                <div className="skeleton" style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div className="skeleton" style={{ height: 14, width: "30%", borderRadius: 4 }} />
                  <div className="skeleton" style={{ height: i % 2 === 0 ? 50 : 80, borderRadius: 10 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <AiCompanion status="idle" />
      </div>
    );
  }

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatColumn}>
        {/* Header */}
        <div className={styles.chatHeader}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5a9cf5" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span className={styles.chatHeaderTitle}>AI Banking Advisor</span>
          {title && <span className={styles.chatHeaderSub}>— {title}</span>}
        </div>

        {/* Messages */}
        <div className={styles.messagesArea}>
          {messages.map((msg, idx) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onSend={handleSend}
              streaming={streaming}
              isLast={idx === messages.length - 1}
            />
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

        {/* Input */}
        <div className={styles.inputArea}>
          <div className={styles.inputRow}>
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
              <button className={styles.micBtn} disabled title="Voice input coming soon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="1" width="6" height="11" rx="3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              </button>
            </div>
            <div className={styles.langToggle}>
              <button className={`${styles.langBtn} ${lang === "EN" ? styles.langBtnActive : ""}`} onClick={() => setLang("EN")}>EN</button>
              <div className={styles.langDivider} />
              <button className={`${styles.langBtn} ${lang === "UR" ? styles.langBtnActive : ""}`} onClick={() => setLang("UR")}>UR</button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Companion */}
      <AiCompanion status={companionStatus} userName={user?.full_name} />
    </div>
  );
}


function detectQuickReplies(content) {
  if (!content) return null;
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  const options = [];

  for (const line of lines) {
    const match = line.match(/^[-*•]\s*(.+)$/);
    if (match && match[1].length < 50) {
      options.push(match[1].replace(/\*\*/g, '').trim());
    }
  }

  const lowerContent = content.toLowerCase();
  if (lowerContent.includes('employment') || lowerContent.includes('occupation') || lowerContent.includes('profession')) {
    if (options.length === 0) {
      return ["Student", "Salaried", "Self-employed", "Business Owner", "Other"];
    }
  }

  if (options.length >= 2 && options.length <= 8) return options;
  return null;
}


function MessageBubble({ message, onSend, streaming, isLast }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [quickRepliesUsed, setQuickRepliesUsed] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Only show quick replies on last assistant message, not streaming, not already used
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
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

        {quickOptions && (
          <QuickReplies
            label="Smart Question"
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
    .replace(/^[-*] (.*$)/gm, "<li>$1</li>")
    .replace(/((?:<li>.*<\/li>\s*)+)/g, "<ul>$1</ul>")
    .replace(/^\d+\. (.*$)/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>")
    .replace(/^(.+)/, "<p>$1</p>");
}
