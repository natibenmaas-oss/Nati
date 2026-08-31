"use client";

import { useEffect } from "react";

// נתפס רק אם ה-Root Layout עצמו קורס - חייב לכלול html/body משלו כי הוא
// מחליף לחלוטין את ה-layout הרגיל (ראו app/error.tsx לשגיאות רגילות).
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled root layout error:", error);
  }, [error]);

  return (
    <html lang="he" dir="rtl">
      <body>
        <main style={{ display: "flex", minHeight: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", padding: "1.5rem", textAlign: "center", fontFamily: "sans-serif" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>משהו השתבש</h1>
          <p style={{ color: "#666", maxWidth: "24rem" }}>
            קרתה שגיאה בלתי צפויה. אפשר לרענן את הדף ולנסות שוב.
          </p>
          <button
            onClick={() => reset()}
            style={{ padding: "0.5rem 1.5rem", borderRadius: "0.5rem", background: "#0f172a", color: "white", fontWeight: 500 }}
          >
            ניסיון נוסף
          </button>
        </main>
      </body>
    </html>
  );
}
