import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader, type NavItem } from "@/components/shared/app-header";

const NAV_ITEMS: NavItem[] = [
  { href: "/student/dashboard", label: "הבית שלי" },
  { href: "/student/progress", label: "ההתקדמות שלי" },
  { href: "/student/achievements", label: "הישגים" },
  { href: "/student/coach", label: "מאמן הקריאה" },
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
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

  if (!profile || profile.role !== "student") redirect("/teacher/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader navItems={NAV_ITEMS} userName={profile.full_name} roleLabel="תלמיד/ה" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
