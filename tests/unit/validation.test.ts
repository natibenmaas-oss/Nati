import { describe, expect, it } from "vitest";
import {
  teacherSignUpSchema,
  teacherLoginSchema,
  studentLoginSchema,
  createStudentSchema,
} from "@/lib/validation/auth";
import { createTextSchema } from "@/lib/validation/texts";
import { createQuestionSchema } from "@/lib/validation/questions";

describe("auth validation", () => {
  it("accepts a valid teacher sign-up", () => {
    const result = teacherSignUpSchema.safeParse({
      full_name: "רונית לוי",
      email: "teacher@school.org.il",
      password: "Demo12345!",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a teacher sign-up with a short password", () => {
    const result = teacherSignUpSchema.safeParse({
      full_name: "רונית לוי",
      email: "teacher@school.org.il",
      password: "123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email on teacher login", () => {
    const result = teacherLoginSchema.safeParse({ email: "not-an-email", password: "x" });
    expect(result.success).toBe(false);
  });

  it("rejects a student username with spaces or Hebrew letters", () => {
    const result = studentLoginSchema.safeParse({ username: "שלומי כהן", password: "x" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid student username", () => {
    const result = studentLoginSchema.safeParse({ username: "shlomi_k", password: "Demo1234!" });
    expect(result.success).toBe(true);
  });

  it("rejects createStudentSchema when class_id is not a UUID", () => {
    const result = createStudentSchema.safeParse({
      full_name: "תלמיד חדש",
      username: "student1",
      password: "abcdef",
      class_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});

describe("text validation", () => {
  const validText = {
    title: "כותרת לדוגמה",
    content: "זהו טקסט לדוגמה שאורכו מספיק כדי לעבור את בדיקת האורך המינימלי.",
    grade_level: "ד׳",
    difficulty: "בינוני",
    genre: "מידע",
    estimated_reading_time: "5",
    vocabulary_level: "בינוני",
    cover_icon: "📖",
    tags: "מדע, חלל",
  };

  it("accepts a valid text and splits tags into an array", () => {
    const result = createTextSchema.safeParse(validText);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual(["מדע", "חלל"]);
    }
  });

  it("rejects a text whose content is too short", () => {
    const result = createTextSchema.safeParse({ ...validText, content: "קצר מדי" });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown difficulty value", () => {
    const result = createTextSchema.safeParse({ ...validText, difficulty: "קשה מאוד" });
    expect(result.success).toBe(false);
  });

  it("defaults tags to an empty array when omitted", () => {
    const result = createTextSchema.safeParse({ ...validText, tags: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.tags).toEqual([]);
  });
});

describe("question validation", () => {
  it("requires at least 2 options and a correct answer for MCQ questions", () => {
    const result = createQuestionSchema.safeParse({
      text_id: "123e4567-e89b-12d3-a456-426614174000",
      type: "mcq",
      question_text: "מה נכון?",
      difficulty: "קל",
      options: [{ key: "1", label: "תשובה אחת" }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid MCQ question with 2+ options and a correct answer", () => {
    const result = createQuestionSchema.safeParse({
      text_id: "123e4567-e89b-12d3-a456-426614174000",
      type: "mcq",
      question_text: "מה נכון?",
      difficulty: "קל",
      options: [
        { key: "1", label: "תשובה א" },
        { key: "2", label: "תשובה ב" },
      ],
      correct_answer: "1",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an open-ended question without options", () => {
    const result = createQuestionSchema.safeParse({
      text_id: "123e4567-e89b-12d3-a456-426614174000",
      type: "inference",
      question_text: "למה לדעתך זה קרה?",
      difficulty: "בינוני",
    });
    expect(result.success).toBe(true);
  });
});
