"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { deleteAccount } from "@/app/settings/actions";
import { Suspense } from "react";

function DeleteAccountFormInner() {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const isConfirmed = confirmText === "DELETE";

  async function handleSubmit(formData: FormData) {
    setIsDeleting(true);
    await deleteAccount(formData);
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {decodeURIComponent(error)}
        </div>
      )}

      <form action={handleSubmit}>
        <input type="hidden" name="confirmation" value={confirmText} />

        <div className="mb-4">
          <label
            htmlFor="confirm-delete"
            className="block text-sm font-medium text-gray-700"
          >
            Type <span className="font-bold">DELETE</span> to confirm
          </label>
          <input
            id="confirm-delete"
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            placeholder="Type DELETE"
            disabled={isDeleting}
          />
        </div>

        <button
          type="submit"
          disabled={!isConfirmed || isDeleting}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDeleting ? "Deleting account..." : "Delete my account"}
        </button>
      </form>
    </div>
  );
}

export default function DeleteAccountForm() {
  return (
    <Suspense fallback={<p className="text-gray-500 text-sm">Loading...</p>}>
      <DeleteAccountFormInner />
    </Suspense>
  );
}
