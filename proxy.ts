import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const PUBLIC_PATHS = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const role = (user?.user_metadata?.role as "teacher" | "student" | undefined) ?? null;
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  // דף הבית תמיד מפנה הלאה - ללוגין או לדשבורד המתאים
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = !user ? "/login" : role === "teacher" ? "/teacher/dashboard" : "/student/dashboard";
    return NextResponse.redirect(url);
  }

  // לא מחובר ומנסה לגשת למסך מוגן -> ללוגין
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // מחובר ומנסה לגשת ללוגין/הרשמה -> לדשבורד המתאים
  if (user && isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = role === "teacher" ? "/teacher/dashboard" : "/student/dashboard";
    return NextResponse.redirect(url);
  }

  // הפרדת הרשאות: תלמיד לא יכול לגשת לאזור מורה ולהפך
  if (user && pathname.startsWith("/teacher") && role !== "teacher") {
    const url = request.nextUrl.clone();
    url.pathname = "/student/dashboard";
    return NextResponse.redirect(url);
  }
  if (user && pathname.startsWith("/student") && role !== "student") {
    const url = request.nextUrl.clone();
    url.pathname = "/teacher/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * התאם לכל הנתיבים חוץ מ-static assets, תמונות, קבצי metadata ו-API של Next עצמו.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
