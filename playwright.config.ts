import { defineConfig, devices } from "@playwright/test";

// ערכים מדומים בלבד, לצורך אתחול הקליינט של Supabase כדי שהאפליקציה תעלה
// ב-CI/בדיקות מקומיות בלי פרויקט Supabase אמיתי. הבדיקות המתאימות (login.spec.ts)
// בודקות רק מסכים ציבוריים (login/register) שלא דורשים session אמיתי.
// כתובת מקומית לא-מאזינה (במקום דומיין ציבורי מזויף) כדי שקריאות הרשת ייכשלו
// מיד (connection refused) במקום להיתקע על timeout/DNS דרך פרוקסי הרשת של הסביבה
const DUMMY_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:9",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
};

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // גרסת @playwright/test של הפרויקט לא תואמת לדפדפן המותקן מראש בסביבה -
        // מצביעים ישירות על ה-executable הקיים במקום להוריד גרסה חדשה.
        // --no-sandbox נדרש כי הסביבה הזו מריצה תהליכים כ-root.
        launchOptions: { executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] },
      },
    },
  ],
  webServer: {
    command: "npm run build && npm run start -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: DUMMY_ENV,
  },
});
