"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { usernameToStudentEmail } from "@/lib/constants";
import { createStudentSchema } from "@/lib/validation/auth";

export interface CreateStudentState {
  error?: string;
  success?: { full_name: string; username: string; password: string };
}

export async function createStudentAction(
  _prevState: CreateStudentState,
  formData: FormData
): Promise<CreateStudentState> {
  const parsed = createStudentSchema.safeParse({
    full_name: formData.get("full_name"),
    username: formData.get("username"),
    password: formData.get("password"),
    class_id: formData.get("class_id"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "נתונים לא תקינים" };
  }

  const { full_name, username, password, class_id } = parsed.data;
  const normalizedUsername = username.toLowerCase();

  const supabase = await createClient();
  const {
    data: { user: teacher },
  } = await supabase.auth.getUser();
  if (!teacher) return { error: "יש להתחבר מחדש" };

  // ודא שהכיתה אכן שייכת למורה המחובר (ה-RLS גם יחסום בהמשך, אבל עדיף הודעת שגיאה ברורה)
  const { data: klass } = await supabase
    .from("classes")
    .select("id")
    .eq("id", class_id)
    .eq("teacher_id", teacher.id)
    .maybeSingle();
  if (!klass) return { error: "הכיתה לא נמצאה" };

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("username", normalizedUsername)
    .maybeSingle();
  if (existing) return { error: "שם המשתמש הזה כבר תפוס. נסה/י שם אחר." };

  // יצירת חשבון ה-Auth בפועל דורשת הרשאת service_role — זו הסיבה היחידה לשימוש ב-admin client כאן.
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: usernameToStudentEmail(normalizedUsername),
    password,
    email_confirm: true,
    user_metadata: { role: "student", full_name, username: normalizedUsername },
  });

  if (createError || !created.user) {
    return { error: "יצירת חשבון התלמיד נכשלה. נסה/י שוב." };
  }

  const studentId = created.user.id;

  // משתי הפעולות הבאות משתמשות בקליינט של המורה עצמו (לא admin) —
  // ה-RLS מוודא שהמורה אכן רשאי לצרף תלמיד לכיתה שלו.
  const { error: memberError } = await supabase
    .from("class_members")
    .insert({ class_id, student_id: studentId });

  if (memberError) {
    return { error: "התלמיד נוצר אך שיוכו לכיתה נכשל. פנה/י לתמיכה." };
  }

  await supabase.from("students").update({ class_id }).eq("id", studentId);

  revalidatePath(`/teacher/classes/${class_id}`);
  revalidatePath("/teacher/dashboard");

  return { success: { full_name, username: normalizedUsername, password } };
}
