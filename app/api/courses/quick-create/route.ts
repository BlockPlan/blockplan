import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addMonths, format } from "date-fns";
import { z } from "zod";

const bodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Course name is required")
    .max(100, "Course name must be 100 characters or less"),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name } = parsed.data;

    // Find an existing term or auto-create one so the user doesn't have to.
    const { data: existingTerm } = await supabase
      .from("terms")
      .select("id")
      .eq("user_id", user.id)
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    let termId = existingTerm?.id as string | undefined;

    if (!termId) {
      const today = new Date();
      const { data: newTerm, error: termError } = await supabase
        .from("terms")
        .insert({
          user_id: user.id,
          name: "Current Term",
          start_date: format(today, "yyyy-MM-dd"),
          end_date: format(addMonths(today, 4), "yyyy-MM-dd"),
        })
        .select("id")
        .single();

      if (termError || !newTerm) {
        console.error("[quick-create] Failed to create term:", termError);
        return NextResponse.json(
          { error: "Failed to create term" },
          { status: 500 }
        );
      }

      termId = newTerm.id as string;
    }

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .insert({
        user_id: user.id,
        term_id: termId,
        name,
      })
      .select("id")
      .single();

    if (courseError || !course) {
      console.error("[quick-create] Failed to create course:", courseError);
      return NextResponse.json(
        { error: "Failed to create course" },
        { status: 500 }
      );
    }

    return NextResponse.json({ courseId: course.id as string });
  } catch (err) {
    console.error("[quick-create] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
