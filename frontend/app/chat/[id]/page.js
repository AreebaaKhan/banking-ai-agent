"use client";

import { useState, useRef, useEffect, use, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { useVoiceInput } from "@/lib/useVoiceInput";
import styles from "../chat-page.module.css";
import AiCompanion from "@/components/AiCompanion";
import MessageBubble from "@/components/MessageBubble";
import { formatAgentName } from "@/lib/chat-utils";

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

  // Voice input — appends transcribed speech to the message input
  const handleVoiceTranscript = useCallback((text) => {
    setMessage((prev) => prev + text);
  }, []);
  const { isListening, interimText, isSupported: voiceSupported, toggleListening } =
    useVoiceInput(lang, handleVoiceTranscript);
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
      const response = await api.sendMessageStream(msgText, conversationId, lang);
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
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5a9cf5" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
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
          {title && <span className={styles.chatHeaderSub}>{title}</span>}
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
              userName={user?.full_name}
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
                placeholder={isListening ? "Listening..." : "Type your message..."}
                value={message + (interimText ? interimText : "")}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button
                className={`${styles.micBtn} ${isListening ? styles.micBtnActive : ""}`}
                onClick={toggleListening}
                disabled={!voiceSupported}
                title={!voiceSupported ? "Voice input not supported in this browser" : isListening ? "Stop recording" : "Start voice input"}
                type="button"
              >
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
