"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import SignOutButton from "@/components/sign-out-button";

function NavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      onClick={onClick}
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMenu = () => setMobileOpen(false);

  return (
    <header className="relative border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="text-lg font-semibold text-gray-900">
          BlockPlan
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-4">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/plan">Plan</NavLink>
          <NavLink href="/tasks">Tasks</NavLink>
          <NavLink href="/courses">Courses</NavLink>
          <NavLink href="/settings">Settings</NavLink>
          <SignOutButton />
        </nav>

        {/* Mobile hamburger */}
        <button
          className="p-2 text-gray-600 hover:text-gray-900 sm:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            {mobileOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {mobileOpen && (
        <nav className="border-t border-gray-100 bg-white px-4 pb-3 pt-2 sm:hidden">
          <div className="flex flex-col gap-2">
            <NavLink href="/dashboard" onClick={closeMenu}>
              Dashboard
            </NavLink>
            <NavLink href="/plan" onClick={closeMenu}>
              Plan
            </NavLink>
            <NavLink href="/tasks" onClick={closeMenu}>
              Tasks
            </NavLink>
            <NavLink href="/courses" onClick={closeMenu}>
              Courses
            </NavLink>
            <NavLink href="/settings" onClick={closeMenu}>
              Settings
            </NavLink>
          </div>
          <div className="mt-2 border-t border-gray-100 pt-2">
            <SignOutButton />
          </div>
        </nav>
      )}
    </header>
  );
}
