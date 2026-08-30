"use client";

import { useActionState } from "react";
import Link from "next/link";
import { teacherSignUpAction, type AuthActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {};

export function TeacherSignUpForm() {
  const [state, formAction, isPending] = useActionState(teacherSignUpAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="full_name">שם מלא</Label>
        <Input id="full_name" name="full_name" type="text" autoComplete="name" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">אימייל</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">סיסמה</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <p className="text-xs text-muted-foreground">לפחות 8 תווים</p>
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state?.info && (
        <p role="status" className="text-sm text-success">
          {state.info}
        </p>
      )}

      <Button type="submit" size="lg" disabled={isPending} className="mt-2">
        {isPending ? "יוצר/ת חשבון..." : "יצירת חשבון מורה"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        כבר יש לך חשבון?{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          התחברות
        </Link>
      </p>
    </form>
  );
}
