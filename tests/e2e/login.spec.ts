import { test, expect } from "@playwright/test";

test.describe("מסך כניסה", () => {
  test("מציג את מסך הכניסה עם שני טאבים, RTL, ועברית", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "ברוכים הבאים ל-ReadWise AI" })).toBeVisible();
    await expect(page.getByText("מאמן הקריאה האישי שלך")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "he");

    await expect(page.getByRole("tab", { name: "כניסה כמורה" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "כניסה כתלמיד/ה" })).toBeVisible();
  });

  test("טופס המורה כברירת מחדל, עם מעבר לטופס התלמיד", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByLabel("אימייל")).toBeVisible();
    await expect(page.getByRole("button", { name: "התחברות כמורה" })).toBeVisible();

    await page.getByRole("tab", { name: "כניסה כתלמיד/ה" }).click();
    await expect(page.getByLabel("שם משתמש")).toBeVisible();
    await expect(page.getByRole("button", { name: "התחברות כתלמיד/ה" })).toBeVisible();
  });

  test("חוסם שליחה עם אימייל לא תקין (ולידציית דפדפן)", async ({ page }) => {
    await page.goto("/login");

    const emailInput = page.getByLabel("אימייל");
    await emailInput.fill("not-an-email");
    await page.getByRole("button", { name: "התחברות כמורה" }).click();

    // דפדפן צריך לחסום שליחה של type=email לא תקין, כך שנשארים באותו עמוד
    await expect(page).toHaveURL(/\/login$/);
  });

  test("מנווט למסך ההרשמה", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "הרשמה כמורה" }).click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.locator('[data-slot="card-title"]')).toHaveText("הרשמה כמורה");
  });

  test("דף לא קיים בתוך אזור ציבורי מציג מסך 404 ידידותי", async ({ page }) => {
    // מסלולים מוגנים תמיד מפנים ל-login כשלא מחוברים (ראו proxy.ts), אז בודקים
    // 404 תחת /login/* - נתיב ציבורי שבו לא תוכנן /nonexistent
    const response = await page.goto("/login/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "הדף לא נמצא" })).toBeVisible();
  });
});
