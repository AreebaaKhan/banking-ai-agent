"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { useVoiceInput } from "@/lib/useVoiceInput";
import styles from "./chat-page.module.css";
import AiCompanion from "@/components/AiCompanion";
import MessageBubble from "@/components/MessageBubble";
import { formatAgentName } from "@/lib/chat-utils";

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
  const [companionStatus, setCompanionStatus] = useState("idle");
  const [lang, setLang] = useState("EN");
  const [activeConversationId, setActiveConversationId] = useState(null);
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

  // Listen for reset-chat event (from New Chat button)
  const resetChat = useCallback(() => {
    setMessages([]);
    setStreaming(false);
    setCurrentAgent(null);
    setCompanionStatus("idle");
    setMessage("");
    setActiveConversationId(null);
  }, []);

  useEffect(() => {
    window.addEventListener("reset-chat", resetChat);
    return () => window.removeEventListener("reset-chat", resetChat);
  }, [resetChat]);

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
      const response = await api.sendMessageStream(msgText, activeConversationId, lang);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let conversationId = activeConversationId;

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

            if (data.type === "conversation_id") {
              conversationId = data.id;
              setActiveConversationId(data.id);
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
              if (conversationId) {
                window.__refreshConversations?.();
                // Use replaceState to update URL without triggering a re-render/flicker
                window.history.replaceState(null, "", `/chat/${conversationId}`);
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

  // Welcome screen (no messages yet)
  if (messages.length === 0) {
    return (
      <div className={styles.chatContainer}>
        <div className={styles.chatColumn}>
          <div className={styles.welcomeScreen}>
            <div className={styles.welcomeGlow} />
            <h1 className={styles.welcomeTitle}>
              Hello, <span style={{ color: "#5a9cf5" }}>{user?.full_name?.split(" ")[0] || "there"}</span>
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
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  {s}
                </button>
              ))}
            </div>
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
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="1" width="6" height="11" rx="3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                </button>
                <button
                  className={styles.sendBtn}
                  onClick={() => handleSend()}
                  disabled={!message.trim() || streaming}
                  title="Send message"
                  type="button"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
              </div>
              {/* EN | UR toggle */}
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

  // Active conversation view
  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatColumn}>
        {/* Header */}
         <div className={styles.chatHeader}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5a9cf5" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>

        {/* Messages */}
        <div className={styles.messagesArea}>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} onSend={handleSend} streaming={streaming} userName={user?.full_name}/>
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
              <button
                className={styles.sendBtn}
                onClick={() => handleSend()}
                disabled={!message.trim() || streaming}
                title="Send message"
                type="button"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
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
