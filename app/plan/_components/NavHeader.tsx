"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import SignOutButton from "@/components/sign-out-button";

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={`text-sm ${
        isActive
          ? "font-medium text-gray-900"
          : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {children}
    </Link>
  );
}

export default function NavHeader() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="text-lg font-semibold text-gray-900">
          BlockPlan
        </Link>
        <nav className="flex items-center gap-4">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/plan">Plan</NavLink>
          <NavLink href="/tasks">Tasks</NavLink>
          <NavLink href="/courses">Courses</NavLink>
          <NavLink href="/settings">Settings</NavLink>
          <SignOutButton />
        </nav>
      </div>
    </header>
  );
}
