/**
 * useVoiceInput — Custom React hook for browser-native speech-to-text.
 *
 * Uses the Web Speech API (SpeechRecognition) which is built into
 * Chrome, Edge, and Safari. Free, real-time, no API keys needed.
 *
 * Supports language switching:
 *   - "EN" → en-US (English recognition)
 *   - "UR" → ur-PK (Urdu recognition — outputs Urdu script directly)
 */

import { useState, useRef, useCallback, useEffect } from "react";

const LANG_MAP = {
  EN: "en-US",
  UR: "ur-PK",
};

export function useVoiceInput(lang = "EN", onTranscript = null) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef(null);

  // Check browser support
  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) return;

    // Stop any existing session
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = LANG_MAP[lang] || "en-US";
    recognition.interimResults = true; // Show live text as user speaks
    recognition.continuous = true; // Keep listening until manually stopped
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setInterimText("");
    };

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }

      // Show interim text for live feedback
      setInterimText(interim);

      // When we have a final result, send it to the callback
      if (finalTranscript && onTranscript) {
        onTranscript(finalTranscript);
        setInterimText("");
      }
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      // Don't stop on "no-speech" — user might just be pausing
      if (event.error !== "no-speech") {
        setIsListening(false);
        setInterimText("");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText("");
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, lang, onTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimText("");
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    interimText, // Live partial transcription text
    isSupported,
    startListening,
    stopListening,
    toggleListening,
  };
}
