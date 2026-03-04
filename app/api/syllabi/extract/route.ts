import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractRequestSchema } from "@/lib/validations/syllabus";
import { extractSyllabusText } from "@/lib/syllabus/extract";
import { parseWithRules } from "@/lib/syllabus/parser-rule-based";
import { parseWithLLM } from "@/lib/syllabus/parser-llm";
import { mergeParserResults } from "@/lib/syllabus/parser-merge";

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

    const parsed = extractRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { storagePath, courseId } = parsed.data;

    // SECURITY: Validate storagePath ownership — must start with user's ID
    if (!storagePath.startsWith(`${user.id}/`)) {
      return NextResponse.json(
        { error: "Access denied to this storage path" },
        { status: 403 }
      );
    }

    // Verify course belongs to user
    const { data: course } = await supabase
      .from("courses")
      .select("id, term_id")
      .eq("id", courseId)
      .eq("user_id", user.id)
      .single();

    if (!course) {
      return NextResponse.json(
        { error: "Course not found or access denied" },
        { status: 403 }
      );
    }

    // Get term for date context (used by rule-based parser)
    const { data: term } = await supabase
      .from("terms")
      .select("id, name, start_date")
      .eq("id", course.term_id)
      .single();

    if (!term) {
      return NextResponse.json(
        { error: "Term not found for this course" },
        { status: 404 }
      );
    }

    // Extract text from the PDF
    const result = await extractSyllabusText(storagePath);

    // Scanned/image PDFs: return 422 with clear message
    if (result.isEmpty) {
      return NextResponse.json(
        {
          error: "no-text",
          message:
            "This PDF appears to be a scanned image. It cannot be parsed automatically. Please enter your assignments manually.",
        },
        { status: 422 }
      );
    }

    // Run both parsers in parallel
    const termStartDate = new Date(term.start_date);
    const termContext = `Term: ${term.name}, starts ${term.start_date}`;

    // Debug: log extracted text so we can see what the parser is working with
    console.log("[extract] PDF text length:", result.text.length);
    console.log("[extract] First 1000 chars of extracted text:", result.text.slice(0, 1000));

    const [ruleItems, llmItems] = await Promise.all([
      Promise.resolve(parseWithRules(result.text, termStartDate)),
      parseWithLLM(result.text, termContext),
    ]);

    console.log("[extract] Rule-based items:", ruleItems.length);
    console.log("[extract] LLM items:", llmItems.length);

    // Merge results (LLM preferred over rule-based duplicates)
    const mergedItems = mergeParserResults(ruleItems, llmItems);

    console.log("[extract] Merged items:", mergedItems.length);

    return NextResponse.json({
      items: mergedItems,
      totalPages: result.totalPages,
      llmUsed: llmItems.length > 0,
    });
  } catch (err) {
    console.error("[extract] Unexpected error:", err);
    return NextResponse.json(
      {
        error: "extraction-failed",
        message:
          "Failed to process syllabus. Please try again or enter tasks manually.",
      },
      { status: 500 }
    );
  }
}
