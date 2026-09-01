"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import ChatInput from "@/components/ChatInput";
import { MessageBubble, formatAgentName, simpleMarkdown, emitAiState } from "@/components/chat-shared";
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

  useEffect(() => {
    emitAiState("idle", `Hi! Nice to see you again 👋`);
  }, []);

  const handleSend = async (text = null) => {
    const msgText = (text || message).trim();
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
              emitAiState("streaming", "I'm working on your response...");
            } else if (data.type === "agent_name") {
              setCurrentAgent(data.name);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, agent_name: data.name } : m
                )
              );
            } else if (data.type === "done") {
              if (conversationId) {
                window.__refreshConversations?.();
                router.push(`/chat/${conversationId}`);
              }
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

  // Welcome screen
  if (messages.length === 0) {
    return (
      <div className={styles.chatContainer}>
        <div className={styles.chatHeader}>
          <div className={styles.headerIcon}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v.5A3.5 3.5 0 0 0 5.5 9c0 1.2.6 2.3 1.5 3A3.5 3.5 0 0 0 5.5 15 3.5 3.5 0 0 0 9 18.5V19a3 3 0 0 0 6 0v-.5A3.5 3.5 0 0 0 18.5 15a3.5 3.5 0 0 0-1-2.7A3.5 3.5 0 0 0 18.5 9 3.5 3.5 0 0 0 15 5.5V5a3 3 0 0 0-3-3z"/>
              <line x1="12" y1="5" x2="12" y2="19"/>
            </svg>
          </div>
          <span className={styles.headerTitle}>AI Banking Advisor</span>
        </div>

        <div className={styles.welcomeScreen}>
          <div className={styles.welcomeGlow} />
          <div className={styles.welcomeIcon}>
            <svg width="56" height="56" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="16" fill="url(#wg)" />
              <path d="M24 8a4 4 0 0 0-4 4v.5a5 5 0 0 0-5 5c0 1.7.9 3.3 2 4a5 5 0 0 0-2 4 5 5 0 0 0 5 5v.5a4 4 0 0 0 8 0V30.5a5 5 0 0 0 5-5 5 5 0 0 0-2-4 5 5 0 0 0 2-4 5 5 0 0 0-5-5V12a4 4 0 0 0-4-4z" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="24" y1="12" x2="24" y2="36" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <defs><linearGradient id="wg" x1="0" y1="0" x2="48" y2="48"><stop stopColor="#5c8fdc"/><stop offset="1" stopColor="#2b5c9e"/></linearGradient></defs>
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
              <button key={i} className={styles.suggestionChip} onClick={() => handleSend(s)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                {s}
              </button>
            ))}
          </div>
        </div>

        <ChatInput
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onSend={() => handleSend()}
          disabled={!message.trim() || streaming}
          placeholder="Ask me about banking in Pakistan..."
          inputRef={inputRef}
        />
        <p className={styles.disclaimer}>AI Banking Advisor provides general guidance. Consult your bank for official advice.</p>
      </div>
    );
  }

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <div className={styles.headerIcon}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v.5A3.5 3.5 0 0 0 5.5 9c0 1.2.6 2.3 1.5 3A3.5 3.5 0 0 0 5.5 15 3.5 3.5 0 0 0 9 18.5V19a3 3 0 0 0 6 0v-.5A3.5 3.5 0 0 0 18.5 15a3.5 3.5 0 0 0-1-2.7A3.5 3.5 0 0 0 18.5 9 3.5 3.5 0 0 0 15 5.5V5a3 3 0 0 0-3-3z"/>
            <line x1="12" y1="5" x2="12" y2="19"/>
          </svg>
        </div>
        <span className={styles.headerTitle}>AI Banking Advisor</span>
      </div>

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
        onSend={() => handleSend()}
        disabled={!message.trim() || streaming}
        placeholder="Type your message..."
        inputRef={inputRef}
      />
    </div>
  );
}
