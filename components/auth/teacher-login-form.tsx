"use client";

import { useActionState } from "react";
import Link from "next/link";
import { teacherLoginAction, type AuthActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {};

export function TeacherLoginForm() {
  const [state, formAction, isPending] = useActionState(teacherLoginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="teacher-email">אימייל</Label>
        <Input
          id="teacher-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="teacher@school.org.il"
          required
          aria-invalid={!!state?.error}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="teacher-password">סיסמה</Label>
        <Input
          id="teacher-password"
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
        {isPending ? "מתחבר/ת..." : "התחברות כמורה"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        אין לך חשבון?{" "}
        <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
          הרשמה כמורה
        </Link>
      </p>
    </form>
  );
}
