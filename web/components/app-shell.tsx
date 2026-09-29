"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Factory, FlaskConical, GitCompareArrows } from "lucide-react";
import type { Language, User } from "@/lib/types";
import { t } from "@/lib/i18n";

export function AppShell({ user, children }: { user: User; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const copy = t(user.language);
  const links = [
    { href: "/dashboard", label: copy.dashboard, icon: BarChart3 },
    { href: "/scenarios", label: copy.scenarios, icon: Factory },
    { href: "/runs", label: copy.runs, icon: FlaskConical },
    { href: "/compare", label: copy.compare, icon: GitCompareArrows },
  ];

  async function setLanguage(language: Language) {
    await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/preferences/language`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ language }),
    });
    router.refresh();
  }

  async function logout() {
    await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/auth/logout`, { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const navigation = (
    <nav className="nav" aria-label="Primary navigation">
      {links.map(({ href, label, icon: Icon }) => (
        <Link className="nav-link" data-active={pathname.startsWith(href)} href={href} key={href}>
          <Icon aria-hidden="true" size={15} />
          {label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <Link className="brand" href="/dashboard">
          <span className="brand-mark" />
          Fabriq
        </Link>
        {navigation}
        <span className="topbar-spacer" />
        <button
          className="button"
          onClick={() => setLanguage(user.language === "ru" ? "en" : "ru")}
          type="button"
        >
          {user.language === "ru" ? "EN" : "RU"}
        </button>
        <button className="button" onClick={logout} type="button">
          {copy.logout}
        </button>
      </header>
      <main className="main" id="main" tabIndex={-1}>
        {children}
      </main>
      <div className="mobile-nav">{navigation.props.children}</div>
    </div>
  );
}
