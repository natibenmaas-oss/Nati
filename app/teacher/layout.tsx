import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader, type NavItem } from "@/components/shared/app-header";

const NAV_ITEMS: NavItem[] = [
  { href: "/teacher/dashboard", label: "דשבורד" },
  { href: "/teacher/classes", label: "כיתות" },
  { href: "/teacher/texts", label: "טקסטים" },
  { href: "/teacher/assignments", label: "משימות" },
  { href: "/teacher/reports", label: "דוחות" },
  { href: "/teacher/assistant", label: "עוזר AI" },
];

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "teacher") redirect("/student/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader navItems={NAV_ITEMS} userName={profile.full_name} roleLabel="מורה" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
