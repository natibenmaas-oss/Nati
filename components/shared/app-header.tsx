"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOutAction } from "@/lib/actions/auth";

export interface NavItem {
  href: string;
  label: string;
}

export function AppHeader({
  navItems,
  userName,
  roleLabel,
}: {
  navItems: NavItem[];
  userName: string;
  roleLabel: string;
}) {
  const pathname = usePathname();

  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-primary">
          <span className="text-xl" aria-hidden>
            📖
          </span>
          <span className="hidden sm:inline">ReadWise AI</span>
        </Link>

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto" aria-label="ניווט ראשי">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium leading-none">{userName}</p>
            <p className="text-xs text-muted-foreground">{roleLabel}</p>
          </div>
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="icon" aria-label="התנתקות">
              <LogOut />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
