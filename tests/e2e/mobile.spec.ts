import { test, expect } from "@playwright/test";

// בדיקת רספונסיביות בסיסית - מסך הכניסה חייב לעבוד היטב בטלפון (Mobile First,
// סעיף 23 במפרט) בלי גלילה אופקית ובלי שהתוכן החשוב נחתך.
// (viewport בגודל טלפון בלבד, בלי אמולציית מגע מלאה - יציב יותר בסביבת ה-CI כאן)
test.use({ viewport: { width: 390, height: 844 } });

test("מסך הכניסה מוצג כראוי בטלפון, ללא גלילה אופקית", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "ברוכים הבאים ל-ReadWise AI" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "כניסה כמורה" })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(hasHorizontalOverflow).toBe(false);
});
