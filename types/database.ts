// טיפוסי מסד הנתונים — נכתבו ידנית בהתאם ל-supabase/migrations/*.sql.
// כאשר יחובר פרויקט Supabase אמיתי, מומלץ להחליף קובץ זה בפלט של:
//   npx supabase gen types typescript --project-id <id> > types/database.ts
// כדי לשמור על סנכרון מלא עם ה-schema האמיתי.

export type SkillKey =
  | "accuracy"
  | "fluency"
  | "reading_rate"
  | "vocabulary"
  | "comprehension"
  | "explicit_info"
  | "inference"
  | "main_idea"
  | "sequence"
  | "cause_effect"
  | "reasoning";

export type UserRole = "teacher" | "student";
export type TextDifficulty = "קל" | "בינוני" | "מאתגר";
export type QuestionType =
  | "explicit"
  | "inference"
  | "main_idea"
  | "vocabulary"
  | "evidence"
  | "critical"
  | "mcq";
export type ReadingMode = "aloud" | "silent";
export type SessionStatus = "in_progress" | "completed" | "abandoned";
export type SubmissionStatus = "not_started" | "in_progress" | "completed";
export type SkillTrend = "up" | "down" | "stable";

interface Table<Row, Insert, Update = Partial<Insert>> {
  Row: Row;
  Insert: Insert;
  Update: Update;
  // נדרש מבנית ע"י @supabase/postgrest-js (GenericTable) כדי שהסקת הטיפוסים
  // של .from(...).select(...) תעבוד; אין לנו קשרים מוגדרים מראש (foreign-table
  // embedding) אז המערך תמיד ריק.
  Relationships: [];
}

export interface Database {
  public: {
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Tables: {
      profiles: Table<
        {
          id: string;
          role: UserRole;
          full_name: string;
          username: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id: string;
          role: UserRole;
          full_name: string;
          username?: string | null;
          avatar_url?: string | null;
        }
      >;
      classes: Table<
        {
          id: string;
          teacher_id: string;
          name: string;
          grade_level: string | null;
          created_at: string;
        },
        { id?: string; teacher_id: string; name: string; grade_level?: string | null }
      >;
      class_members: Table<
        { id: string; class_id: string; student_id: string; joined_at: string },
        { id?: string; class_id: string; student_id: string }
      >;
      students: Table<
        {
          id: string;
          class_id: string | null;
          reading_level: string;
          current_streak: number;
          longest_streak: number;
          total_points: number;
          last_activity_at: string | null;
          created_at: string;
        },
        {
          id: string;
          class_id?: string | null;
          reading_level?: string;
          current_streak?: number;
          longest_streak?: number;
          total_points?: number;
          last_activity_at?: string | null;
        }
      >;
      skills: Table<
        { id: string; key: SkillKey; name_he: string; description: string | null },
        { id?: string; key: SkillKey; name_he: string; description?: string | null }
      >;
      texts: Table<
        {
          id: string;
          title: string;
          content: string;
          grade_level: string;
          difficulty: TextDifficulty;
          genre: string;
          estimated_reading_time: number;
          vocabulary_level: string | null;
          tags: string[];
          cover_icon: string;
          created_by: string | null;
          is_ai_generated: boolean;
          generation_purpose_skill_id: string | null;
          created_at: string;
        },
        {
          id?: string;
          title: string;
          content: string;
          grade_level: string;
          difficulty: TextDifficulty;
          genre: string;
          estimated_reading_time?: number;
          vocabulary_level?: string | null;
          tags?: string[];
          cover_icon?: string;
          created_by?: string | null;
          is_ai_generated?: boolean;
          generation_purpose_skill_id?: string | null;
        }
      >;
      vocabulary_words: Table<
        {
          id: string;
          text_id: string;
          word: string;
          definition: string;
          example_sentence: string | null;
          difficulty_level: string | null;
          created_at: string;
        },
        {
          id?: string;
          text_id: string;
          word: string;
          definition: string;
          example_sentence?: string | null;
          difficulty_level?: string | null;
        }
      >;
      questions: Table<
        {
          id: string;
          text_id: string;
          skill_id: string | null;
          type: QuestionType;
          question_text: string;
          options: { key: string; label: string }[] | null;
          correct_answer: string | null;
          difficulty: TextDifficulty;
          order_index: number;
          created_at: string;
        },
        {
          id?: string;
          text_id: string;
          skill_id?: string | null;
          type: QuestionType;
          question_text: string;
          options?: { key: string; label: string }[] | null;
          correct_answer?: string | null;
          difficulty?: TextDifficulty;
          order_index?: number;
        }
      >;
      assignments: Table<
        {
          id: string;
          teacher_id: string;
          class_id: string;
          text_id: string;
          title: string;
          instructions: string | null;
          skill_focus: string[];
          due_date: string | null;
          created_at: string;
        },
        {
          id?: string;
          teacher_id: string;
          class_id: string;
          text_id: string;
          title: string;
          instructions?: string | null;
          skill_focus?: string[];
          due_date?: string | null;
        }
      >;
      assignment_submissions: Table<
        {
          id: string;
          assignment_id: string;
          student_id: string;
          session_id: string | null;
          status: SubmissionStatus;
          score: number | null;
          submitted_at: string | null;
          created_at: string;
        },
        {
          id?: string;
          assignment_id: string;
          student_id: string;
          session_id?: string | null;
          status?: SubmissionStatus;
          score?: number | null;
          submitted_at?: string | null;
        }
      >;
      reading_sessions: Table<
        {
          id: string;
          student_id: string;
          text_id: string;
          assignment_id: string | null;
          reading_mode: ReadingMode;
          status: SessionStatus;
          started_at: string;
          completed_at: string | null;
          duration_seconds: number | null;
          wpm_estimated: number | null;
          is_estimated: boolean;
          recognized_word_count: number | null;
          pause_count: number | null;
          recognized_accuracy: number | null;
          reflection_text: string | null;
          created_at: string;
        },
        {
          id?: string;
          student_id: string;
          text_id: string;
          assignment_id?: string | null;
          reading_mode: ReadingMode;
          status?: SessionStatus;
          completed_at?: string | null;
          duration_seconds?: number | null;
          wpm_estimated?: number | null;
          is_estimated?: boolean;
          recognized_word_count?: number | null;
          pause_count?: number | null;
          recognized_accuracy?: number | null;
          reflection_text?: string | null;
        }
      >;
      answers: Table<
        {
          id: string;
          session_id: string;
          question_id: string;
          student_answer: string | null;
          is_correct: boolean | null;
          ai_score: number | null;
          ai_feedback: AiEvaluationResult | null;
          hints_used: number;
          attempt_number: number;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          session_id: string;
          question_id: string;
          student_answer?: string | null;
          is_correct?: boolean | null;
          ai_score?: number | null;
          ai_feedback?: AiEvaluationResult | null;
          hints_used?: number;
          attempt_number?: number;
        }
      >;
      student_skill_scores: Table<
        {
          id: string;
          student_id: string;
          skill_id: string;
          score: number;
          sample_size: number;
          trend: SkillTrend;
          updated_at: string;
        },
        {
          id?: string;
          student_id: string;
          skill_id: string;
          score?: number;
          sample_size?: number;
          trend?: SkillTrend;
          updated_at?: string;
        }
      >;
      student_skill_score_history: Table<
        { id: string; student_id: string; skill_id: string; score: number; recorded_at: string },
        { id?: string; student_id: string; skill_id: string; score: number; recorded_at?: string }
      >;
      student_vocabulary: Table<
        {
          id: string;
          student_id: string;
          word_id: string;
          mastery_level: number;
          review_count: number;
          learned_at: string;
        },
        {
          id?: string;
          student_id: string;
          word_id: string;
          mastery_level?: number;
          review_count?: number;
        }
      >;
      achievements: Table<
        {
          id: string;
          key: string;
          title: string;
          description: string;
          icon: string;
          criteria: Record<string, unknown>;
        },
        never
      >;
      student_achievements: Table<
        { id: string; student_id: string; achievement_id: string; earned_at: string },
        { id?: string; student_id: string; achievement_id: string }
      >;
      ai_feedback: Table<
        {
          id: string;
          student_id: string;
          related_type: string;
          related_id: string | null;
          feedback_text: string;
          feedback_type: string;
          created_at: string;
        },
        {
          id?: string;
          student_id: string;
          related_type: string;
          related_id?: string | null;
          feedback_text: string;
          feedback_type?: string;
        }
      >;
      teacher_notes: Table<
        {
          id: string;
          teacher_id: string;
          student_id: string;
          note_text: string;
          created_at: string;
        },
        { id?: string; teacher_id: string; student_id: string; note_text: string }
      >;
      notifications: Table<
        {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          is_read: boolean;
          related_url: string | null;
          created_at: string;
        },
        {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body?: string | null;
          is_read?: boolean;
          related_url?: string | null;
        }
      >;
    };
  };
}

/** הפלט המובנה של lib/ai/evaluateAnswer, נשמר כפי שהוא בעמודת answers.ai_feedback */
export interface AiEvaluationResult {
  score: number;
  correct: boolean;
  reasoning: string;
  missing_elements: string[];
  feedback: string;
  next_step: string;
}

export type TableName = keyof Database["public"]["Tables"];
export type Row<T extends TableName> = Database["public"]["Tables"][T]["Row"];
export type Insert<T extends TableName> = Database["public"]["Tables"][T]["Insert"];
export type Update<T extends TableName> = Database["public"]["Tables"][T]["Update"];
