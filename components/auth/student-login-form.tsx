"use client";

import { useActionState } from "react";
import { studentLoginAction, type AuthActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {};

export function StudentLoginForm() {
  const [state, formAction, isPending] = useActionState(studentLoginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="student-username">שם משתמש</Label>
        <Input
          id="student-username"
          name="username"
          type="text"
          autoComplete="username"
          placeholder="השם משתמש שקיבלת מהמורה"
          required
          aria-invalid={!!state?.error}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="student-password">סיסמה</Label>
        <Input
          id="student-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={!!state?.error}
        />
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={isPending} className="mt-2">
        {isPending ? "מתחבר/ת..." : "התחברות כתלמיד/ה"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        לא זוכר/ת את הפרטים? בקש/י מהמורה שלך לאפס לך סיסמה
      </p>
    </form>
  );
}
