import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TeacherSignUpForm } from "@/components/auth/teacher-signup-form";

export const metadata = { title: "הרשמה — ReadWise AI" };

export default function RegisterPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">הרשמה כמורה</CardTitle>
        <CardDescription>
          חשבונות תלמידים נוצרים על ידי המורה מתוך המערכת, לאחר ההרשמה
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TeacherSignUpForm />
      </CardContent>
    </Card>
  );
}
