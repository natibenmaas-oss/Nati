/**
 * יצירת נתוני דמו לצורך בדיקת המערכת: מורה אחד, כיתה אחת, 8 תלמידים.
 * (טקסטים, שאלות ונתוני קריאה היסטוריים יתווספו בהמשך יחד עם Text/Question Engine.)
 *
 * הרצה:
 *   npx tsx scripts/seed-demo.ts
 *
 * דורש את משתני הסביבה מתוך .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * הסקריפט אידמפוטנטי: אפשר להריץ אותו כמה פעמים בלי ליצור כפילויות
 * (משתמש ב-upsert / בדיקת קיום לפי email).
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import type { Database } from "../types/database";
import { usernameToStudentEmail } from "../lib/constants";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "❌ חסרים NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ב-.env.local"
  );
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_TEACHER = {
  email: "teacher.demo@readwise.local",
  password: "Demo12345!",
  full_name: "רונית לוי",
};

const DEMO_STUDENTS = [
  { username: "shlomi", full_name: "שלומי כהן" },
  { username: "yehonatan", full_name: "יהונתן מזרחי" },
  { username: "israel", full_name: "ישראל דוד" },
  { username: "noa", full_name: "נועה אברהם" },
  { username: "tamar", full_name: "תמר גולן" },
  { username: "eitan", full_name: "איתן שפירא" },
  { username: "maya", full_name: "מאיה בן דוד" },
  { username: "amit", full_name: "עמית פרץ" },
];

async function findUserByEmail(email: string) {
  // Admin API אינו תומך בחיפוש לפי email ישירות בכל הגרסאות — נשתמש ב-listUsers עם pagination קטנה,
  // מספיק לכמות הדמו הקטנה כאן.
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 });
  if (error) throw error;
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function ensureTeacher() {
  let user = await findUserByEmail(DEMO_TEACHER.email);

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: DEMO_TEACHER.email,
      password: DEMO_TEACHER.password,
      email_confirm: true,
      user_metadata: { role: "teacher", full_name: DEMO_TEACHER.full_name },
    });
    if (error) throw error;
    user = data.user;
    console.log(`✅ נוצר משתמש מורה: ${DEMO_TEACHER.email}`);
  } else {
    console.log(`↪️  משתמש מורה כבר קיים: ${DEMO_TEACHER.email}`);
  }

  return user!;
}

async function ensureClass(teacherId: string) {
  const { data: existing } = await supabase
    .from("classes")
    .select("id")
    .eq("teacher_id", teacherId)
    .eq("name", 'כיתה ד׳1')
    .maybeSingle();

  if (existing) {
    console.log("↪️  כיתת הדמו כבר קיימת");
    return existing.id;
  }

  const { data, error } = await supabase
    .from("classes")
    .insert({ teacher_id: teacherId, name: 'כיתה ד׳1', grade_level: "ד׳" })
    .select("id")
    .single();
  if (error) throw error;
  console.log("✅ נוצרה כיתת דמו: כיתה ד׳1");
  return data.id;
}

async function ensureStudent(
  student: { username: string; full_name: string },
  classId: string
) {
  const email = usernameToStudentEmail(student.username);
  let user = await findUserByEmail(email);

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: "Demo1234!",
      email_confirm: true,
      user_metadata: { role: "student", full_name: student.full_name, username: student.username },
    });
    if (error) throw error;
    user = data.user;
    console.log(`✅ נוצר תלמיד: ${student.full_name} (${student.username})`);
  } else {
    console.log(`↪️  תלמיד כבר קיים: ${student.full_name}`);
  }

  await supabase.from("students").update({ class_id: classId }).eq("id", user!.id);
  await supabase
    .from("class_members")
    .upsert({ class_id: classId, student_id: user!.id }, { onConflict: "class_id,student_id" });
}

async function main() {
  console.log("🌱 מתחיל זריעת נתוני דמו ל-ReadWise AI...\n");

  const teacher = await ensureTeacher();
  const classId = await ensureClass(teacher.id);

  for (const student of DEMO_STUDENTS) {
    await ensureStudent(student, classId);
  }

  console.log("\n✅ סיום. פרטי התחברות לדמו:");
  console.log(`   מורה  -> אימייל: ${DEMO_TEACHER.email} | סיסמה: ${DEMO_TEACHER.password}`);
  console.log(`   תלמיד -> שם משתמש: ${DEMO_STUDENTS[0].username} | סיסמה: Demo1234!`);
}

main().catch((err) => {
  console.error("❌ זריעת הדמו נכשלה:", err);
  process.exit(1);
});
