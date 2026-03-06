"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import SignOutButton from "@/components/sign-out-button";

function NavLink({
  href,
  children,
  onClick,
  mobile,
  dataTour,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  mobile?: boolean;
  dataTour?: string;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  if (mobile) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={`rounded-lg px-4 py-2.5 text-sm transition-colors duration-150 ${
          isActive
            ? "bg-blue-50 font-medium text-blue-600"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        {children}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      data-tour={dataTour}
      className={`relative py-1 text-sm transition-colors duration-150 ${
        isActive
          ? "font-medium text-blue-600 after:absolute after:-bottom-[13px] after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-blue-600"
          : "text-gray-500 hover:text-gray-900"
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
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-[var(--shadow-nav)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight text-gray-900">
          <span className="text-blue-600">Block</span>Plan
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-5 sm:flex">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/plan" dataTour="nav-calendar">Calendar</NavLink>
          <NavLink href="/tasks" dataTour="nav-tasks">Tasks</NavLink>
          <NavLink href="/grades">Grades</NavLink>
          <NavLink href="/study-help" dataTour="nav-study-help">Study Help</NavLink>
          <NavLink href="/courses">Courses</NavLink>
          <NavLink href="/syllabi/upload" dataTour="nav-upload-syllabus">Upload Syllabus</NavLink>
          <NavLink href="/profile">Profile</NavLink>
          <SignOutButton />
        </nav>

        {/* Mobile hamburger */}
        <button
          className="rounded-lg p-2 text-gray-600 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900 sm:hidden"
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
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out sm:hidden ${
          mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="border-t border-gray-100 bg-white/95 px-4 pb-3 pt-2">
          <div className="flex flex-col gap-1">
            <NavLink href="/dashboard" onClick={closeMenu} mobile>
              Dashboard
            </NavLink>
            <NavLink href="/plan" onClick={closeMenu} mobile>
              Calendar
            </NavLink>
            <NavLink href="/tasks" onClick={closeMenu} mobile>
              Tasks
            </NavLink>
            <NavLink href="/grades" onClick={closeMenu} mobile>
              Grades
            </NavLink>
            <NavLink href="/study-help" onClick={closeMenu} mobile>
              Study Help
            </NavLink>
            <NavLink href="/courses" onClick={closeMenu} mobile>
              Courses
            </NavLink>
            <NavLink href="/syllabi/upload" onClick={closeMenu} mobile>
              Upload Syllabus
            </NavLink>
            <NavLink href="/profile" onClick={closeMenu} mobile>
              Profile
            </NavLink>
          </div>
          <div className="mt-2 border-t border-gray-100 pt-2">
            <SignOutButton />
          </div>
        </nav>
      </div>
    </header>
  );
}
