"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { usernameToStudentEmail } from "@/lib/constants";
import { teacherLoginSchema, teacherSignUpSchema, studentLoginSchema } from "@/lib/validation/auth";

export interface AuthActionState {
  error?: string;
  info?: string;
}

const GENERIC_LOGIN_ERROR = "שם משתמש/אימייל או סיסמה שגויים";

export async function teacherSignUpAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = teacherSignUpSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "נתונים לא תקינים" };
  }

  const { full_name, email, password } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: "teacher", full_name } },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered") || error.code === "user_already_exists") {
      return { error: "כתובת האימייל כבר רשומה במערכת. נסה/י להתחבר." };
    }
    return { error: "ההרשמה נכשלה. נסה/י שוב מאוחר יותר." };
  }

  // אם אימות אימייל מופעל בפרויקט ה-Supabase, לא תתקבל session מיידית
  if (!data.session) {
    return { info: "נשלח אימייל לאישור החשבון. לאחר האישור ניתן יהיה להתחבר." };
  }

  redirect("/teacher/dashboard");
}

export async function teacherLoginAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = teacherLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "נתונים לא תקינים" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  redirect("/teacher/dashboard");
}

export async function studentLoginAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = studentLoginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "נתונים לא תקינים" };
  }

  const { username, password } = parsed.data;

  // שם המשתמש עצמו הוא הבסיס לכתובת הסינתטית שנוצרה בעת יצירת החשבון ע"י המורה
  const email = usernameToStudentEmail(username);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  redirect("/student/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * לוודא ש-username פנוי, כדי לתת למורה משוב מיידי בטופס יצירת תלמיד.
 * משתמש ב-admin client כי profiles.username לא נגיש לפי RLS למי שאינו הבעלים/המורה של אותו תלמיד.
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  return !data;
}
