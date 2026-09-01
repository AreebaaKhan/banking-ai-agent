"use client";

import { useState, useRef, useEffect, use } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import ChatInput from "@/components/ChatInput";
import { MessageBubble, formatAgentName, simpleMarkdown, emitAiState } from "@/components/chat-shared";
import styles from "../chat-page.module.css";

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
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    emitAiState("idle", "Need any assistance?");
  }, []);

  useEffect(() => {
    const loadConversation = async () => {
      try {
        const data = await api.getConversation(conversationId);
        setMessages(
          (data.messages || []).map((m, i) => ({ ...m, id: m.id || i }))
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

  const handleSend = async () => {
    const msgText = message.trim();
    if (!msgText || streaming) return;

    setMessage("");
    const userMsg = { role: "user", content: msgText, id: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);
    emitAiState("thinking", "Let me check that for you...");

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
                  m.id === assistantId ? { ...m, content: m.content + data.content } : m
                )
              );
              emitAiState("streaming", "I'm working on your response...");
            } else if (data.type === "agent_name") {
              setCurrentAgent(data.name);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, agent_name: data.name } : m
                )
              );
            } else if (data.type === "done") {
              window.__refreshConversations?.();
              emitAiState("completed", "Here's what I found.");
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
      setTimeout(() => emitAiState("idle", "Need any assistance?"), 2000);
    }
  };

  if (loading) {
    return (
      <div className={styles.chatContainer}>
        <div className={styles.messagesArea}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={styles.messageRow} style={{ maxWidth: "var(--max-chat-width)", margin: "0 auto" }}>
              <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="skeleton" style={{ height: 16, width: "30%", borderRadius: 4 }} />
                <div className="skeleton" style={{ height: i % 2 === 0 ? 60 : 100, borderRadius: 12 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chatContainer}>
      {/* Header */}
      <div className={styles.chatHeader}>
        <div className={styles.headerIcon}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v.5A3.5 3.5 0 0 0 5.5 9c0 1.2.6 2.3 1.5 3A3.5 3.5 0 0 0 5.5 15 3.5 3.5 0 0 0 9 18.5V19a3 3 0 0 0 6 0v-.5A3.5 3.5 0 0 0 18.5 15a3.5 3.5 0 0 0-1-2.7A3.5 3.5 0 0 0 18.5 9 3.5 3.5 0 0 0 15 5.5V5a3 3 0 0 0-3-3z"/>
            <line x1="12" y1="5" x2="12" y2="19"/>
          </svg>
        </div>
        <span className={styles.headerTitle}>AI Banking Advisor</span>
        <span className={styles.headerSub}>· {title}</span>
      </div>

      {/* Messages */}
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

      <ChatInput
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onSend={handleSend}
        disabled={!message.trim() || streaming}
        placeholder="Type your message..."
        inputRef={inputRef}
      />
    </div>
  );
}
