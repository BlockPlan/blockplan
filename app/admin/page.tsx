import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admin | BlockPlan",
  description: "Admin dashboard",
};

// Add additional admin emails here (lowercase)
const ADMIN_EMAILS = [
  "trevor@prohealthcareproducts.com",
];

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");
  if (!user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    redirect("/dashboard");
  }

  const admin = createAdminClient();

  // === Users ===
  const { data: usersList } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const allUsers = usersList?.users ?? [];
  const totalUsers = allUsers.length;

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const newToday = allUsers.filter(
    (u) => new Date(u.created_at) >= dayAgo
  ).length;
  const newThisWeek = allUsers.filter(
    (u) => new Date(u.created_at) >= weekAgo
  ).length;
  const newThisMonth = allUsers.filter(
    (u) => new Date(u.created_at) >= monthAgo
  ).length;

  const activeThisWeek = allUsers.filter(
    (u) => u.last_sign_in_at && new Date(u.last_sign_in_at) >= weekAgo
  ).length;

  // === Subscription breakdown ===
  const { data: profiles } = await admin
    .from("user_profiles")
    .select("id, subscription_plan, subscription_status, stripe_customer_id");

  const planCounts = {
    free: 0,
    pro: 0,
    max: 0,
  };
  for (const p of profiles ?? []) {
    const plan = (p.subscription_plan as string) || "free";
    if (plan in planCounts) {
      planCounts[plan as keyof typeof planCounts]++;
    }
  }

  const totalSubscribers = planCounts.pro + planCounts.max;

  // === Course / task counts ===
  const { count: totalCourses } = await admin
    .from("courses")
    .select("*", { count: "exact", head: true });
  const { count: totalTasks } = await admin
    .from("tasks")
    .select("*", { count: "exact", head: true });

  // === Recent signups list (last 10) ===
  const recentSignups = [...allUsers]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 10);

  // Build email → plan map for recent signups
  const emailToPlan = new Map<string, string>();
  for (const p of profiles ?? []) {
    emailToPlan.set(p.id as string, (p.subscription_plan as string) || "free");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-900">
              BlockPlan Admin
            </h1>
            <span className="rounded-md bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to app
            </Link>
            <span className="text-gray-400">|</span>
            <span className="text-gray-500">{user.email}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Top stat cards */}
        <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total Users" value={totalUsers} />
          <StatCard
            label="Paid Subscribers"
            value={totalSubscribers}
            highlight
          />
          <StatCard label="Active (7d)" value={activeThisWeek} />
          <StatCard label="New (30d)" value={newThisMonth} />
        </section>

        {/* Plan breakdown */}
        <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            Subscription Breakdown
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <PlanCard label="Free" value={planCounts.free} color="gray" />
            <PlanCard label="Pro" value={planCounts.pro} color="blue" />
            <PlanCard label="Max" value={planCounts.max} color="purple" />
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Estimated MRR:{" "}
            <span className="font-semibold text-gray-900">
              ${(planCounts.pro * 9 + planCounts.max * 19).toLocaleString()}
            </span>{" "}
            <span className="text-xs text-gray-400">
              (assuming $9/Pro, $19/Max — adjust to actual prices)
            </span>
          </p>
        </section>

        {/* Growth section */}
        <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-base font-semibold text-gray-900">
              Growth
            </h2>
            <dl className="space-y-3">
              <Row label="New today" value={newToday} />
              <Row label="New this week" value={newThisWeek} />
              <Row label="New this month" value={newThisMonth} />
              <Row label="Active this week" value={activeThisWeek} />
            </dl>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-base font-semibold text-gray-900">
              Usage
            </h2>
            <dl className="space-y-3">
              <Row label="Total courses created" value={totalCourses ?? 0} />
              <Row label="Total tasks created" value={totalTasks ?? 0} />
              <Row
                label="Avg courses / user"
                value={
                  totalUsers > 0
                    ? ((totalCourses ?? 0) / totalUsers).toFixed(1)
                    : "0"
                }
              />
              <Row
                label="Avg tasks / user"
                value={
                  totalUsers > 0
                    ? ((totalTasks ?? 0) / totalUsers).toFixed(1)
                    : "0"
                }
              />
            </dl>
          </div>
        </section>

        {/* Recent signups */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            Recent Signups
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500">
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Plan</th>
                  <th className="pb-2 font-medium">Created</th>
                  <th className="pb-2 font-medium">Last sign-in</th>
                </tr>
              </thead>
              <tbody>
                {recentSignups.map((u) => {
                  const plan = emailToPlan.get(u.id) || "free";
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="py-2 text-gray-900">{u.email}</td>
                      <td className="py-2">
                        <PlanBadge plan={plan} />
                      </td>
                      <td className="py-2 text-gray-500">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-2 text-gray-500">
                        {u.last_sign_in_at
                          ? new Date(u.last_sign_in_at).toLocaleDateString()
                          : "Never"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-6 text-xs text-gray-400">
          For traffic analytics (page views, sessions, referrers), check Vercel
          Analytics or Google Analytics.
        </p>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-lg border p-4",
        highlight
          ? "border-purple-200 bg-purple-50"
          : "border-gray-200 bg-white",
      ].join(" ")}
    >
      <p className="text-xs font-medium uppercase text-gray-500">{label}</p>
      <p
        className={[
          "mt-1 text-2xl font-bold",
          highlight ? "text-purple-700" : "text-gray-900",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

function PlanCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "gray" | "blue" | "purple";
}) {
  const colors = {
    gray: "bg-gray-50 text-gray-700",
    blue: "bg-blue-50 text-blue-700",
    purple: "bg-purple-50 text-purple-700",
  };
  return (
    <div className={`rounded-lg p-4 ${colors[color]}`}>
      <p className="text-xs font-medium uppercase opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0">
      <dt className="text-sm text-gray-600">{label}</dt>
      <dd className="text-sm font-semibold text-gray-900">{value}</dd>
    </div>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const styles: Record<string, string> = {
    free: "bg-gray-100 text-gray-700",
    pro: "bg-blue-100 text-blue-700",
    max: "bg-purple-100 text-purple-700",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        styles[plan] || styles.free
      }`}
    >
      {plan}
    </span>
  );
}
