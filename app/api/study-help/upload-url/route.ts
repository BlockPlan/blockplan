import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { studyHelpUploadRequestSchema } from "@/lib/validations/study-help";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = studyHelpUploadRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { filename, courseId } = parsed.data;

    // If courseId provided, verify it belongs to user
    if (courseId) {
      const { data: course } = await supabase
        .from("courses")
        .select("id")
        .eq("id", courseId)
        .eq("user_id", user.id)
        .single();

      if (!course) {
        return NextResponse.json(
          { error: "Course not found or access denied" },
          { status: 403 }
        );
      }
    }

    // Construct storage path: userId/timestamp-filename
    const storagePath = `${user.id}/${Date.now()}-${filename}`;

    // Generate signed upload URL (requires service role key)
    const adminClient = createAdminClient();
    const { data, error } = await adminClient.storage
      .from("study_materials")
      .createSignedUploadUrl(storagePath);

    if (error || !data) {
      console.error("[study-help/upload-url] Failed to create signed upload URL:", error);
      return NextResponse.json(
        { error: "Failed to generate upload URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      path: storagePath,
      token: data.token,
    });
  } catch (err) {
    console.error("[study-help/upload-url] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
