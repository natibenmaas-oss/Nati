"use client";

import { useCallback, useRef, useState } from "react";

// פער בין תוצאות זיהוי שנחשב "עצירה" משמעותית בקריאה (סעיף 11 במפרט - "עצירות")
const PAUSE_THRESHOLD_MS = 2500;

export interface SpeechTrackingResult {
  recognizedText: string;
  recognizedWordCount: number;
  pauseCount: number;
  speakingDurationSeconds: number;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * עטיפה סביב Web Speech API למדידת קריאה בקול.
 *
 * חשוב: זהו כלי מדידה משוער בלבד. תמיכת דפדפנים חלקית (לא נתמך בפיירפוקס,
 * לא אמין תמיד ב-iOS Safari), והזיהוי עצמו אינו מושלם. אין להציג את הפלט שלו
 * כמדד מדויק - תמיד יש לתייג "משוער" (ראו reading-step.tsx).
 */
export function useSpeechRecognition() {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef("");
  const lastResultTimeRef = useRef<number | null>(null);
  const pauseCountRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback((): boolean => {
    const SpeechRecognitionCtor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setError("זיהוי דיבור אינו נתמך בדפדפן הזה");
      return false;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "he-IL";
    recognition.continuous = true;
    recognition.interimResults = true;

    transcriptRef.current = "";
    pauseCountRef.current = 0;
    startTimeRef.current = Date.now();
    lastResultTimeRef.current = Date.now();

    recognition.onresult = (event) => {
      const now = Date.now();
      if (lastResultTimeRef.current && now - lastResultTimeRef.current > PAUSE_THRESHOLD_MS) {
        pauseCountRef.current += 1;
      }
      lastResultTimeRef.current = now;

      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript + " ";
        }
      }
      if (finalText) transcriptRef.current += finalText;
    };

    recognition.onerror = (event) => {
      // "no-speech" ו-"aborted" קורים כל הזמן כשהתלמיד/ה שותק/ת רגע - לא שגיאה אמיתית
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("לא ניתנה הרשאה למיקרופון - אפשר להמשיך לקרוא בלי מדידת קול");
      }
    };

    recognition.onend = () => setIsListening(false);

    try {
      recognition.start();
    } catch {
      setError("לא ניתן להפעיל זיהוי דיבור כרגע");
      return false;
    }

    recognitionRef.current = recognition;
    setIsListening(true);
    setError(null);
    return true;
  }, []);

  const stop = useCallback((): SpeechTrackingResult => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // כבר נעצר - לא קריטי
    }
    recognitionRef.current = null;
    setIsListening(false);

    const speakingDurationSeconds = startTimeRef.current
      ? Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
      : 0;
    const recognizedText = transcriptRef.current.trim();
    const recognizedWordCount = recognizedText ? recognizedText.split(/\s+/).filter(Boolean).length : 0;

    return {
      recognizedText,
      recognizedWordCount,
      pauseCount: pauseCountRef.current,
      speakingDurationSeconds,
    };
  }, []);

  return { start, stop, isListening, error };
}
