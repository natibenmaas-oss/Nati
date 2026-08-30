import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeacherLoginForm } from "@/components/auth/teacher-login-form";
import { StudentLoginForm } from "@/components/auth/student-login-form";

export const metadata = { title: "כניסה — ReadWise AI" };

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">כניסה למערכת</CardTitle>
        <CardDescription>בחר/י את סוג החשבון שלך כדי להתחבר</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="teacher" dir="rtl">
          <TabsList className="mb-6 grid w-full grid-cols-2">
            <TabsTrigger value="teacher">כניסה כמורה</TabsTrigger>
            <TabsTrigger value="student">כניסה כתלמיד/ה</TabsTrigger>
          </TabsList>
          <TabsContent value="teacher">
            <TeacherLoginForm />
          </TabsContent>
          <TabsContent value="student">
            <StudentLoginForm />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
