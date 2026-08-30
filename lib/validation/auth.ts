import { z } from "zod";

export const teacherSignUpSchema = z.object({
  full_name: z.string().trim().min(2, "יש להזין שם מלא (לפחות 2 תווים)"),
  email: z.string().trim().email("כתובת אימייל לא תקינה"),
  password: z.string().min(8, "הסיסמה חייבת להכיל לפחות 8 תווים"),
});

export const teacherLoginSchema = z.object({
  email: z.string().trim().email("כתובת אימייל לא תקינה"),
  password: z.string().min(1, "יש להזין סיסמה"),
});

export const studentLoginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, "יש להזין שם משתמש")
    .regex(/^[a-zA-Z0-9_.-]+$/, "שם משתמש יכול להכיל אותיות באנגלית, מספרים, נקודה וקו תחתון"),
  password: z.string().min(1, "יש להזין סיסמה"),
});

// שם משתמש בעברית מותר ל-input של המשתמש; לנרמול פנימי בעת יצירת חשבון תלמיד ע"י מורה
export const createStudentSchema = z.object({
  full_name: z.string().trim().min(2, "יש להזין שם מלא"),
  username: z
    .string()
    .trim()
    .min(3, "שם משתמש חייב להכיל לפחות 3 תווים")
    .regex(/^[a-zA-Z0-9_.-]+$/, "שם משתמש יכול להכיל אותיות באנגלית, מספרים, נקודה וקו תחתון"),
  password: z.string().min(6, "הסיסמה חייבת להכיל לפחות 6 תווים"),
  class_id: z.string().uuid("יש לבחור כיתה"),
});
