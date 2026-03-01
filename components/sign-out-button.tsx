"use client";

import { signout } from "@/app/auth/actions";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signout()}
      className="text-sm text-gray-500 hover:text-gray-700"
    >
      Sign Out
    </button>
  );
}
