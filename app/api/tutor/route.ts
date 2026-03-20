import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan, canUseTutorChat } from "@/lib/subscription";
import type { StudyHelp } from "@/lib/study-help/types";
import { classifyAIError } from "@/lib/ai-errors";

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Check subscription
  const plan = await getUserPlan(user.id);
  if (!canUseTutorChat(plan)) {
    return new Response("AI Tutor requires a Pro or MAX subscription.", { status: 403 });
  }

  const { messages, sessionId } = await req.json();

  if (!sessionId || !messages || !Array.isArray(messages)) {
    return new Response("Missing sessionId or messages", { status: 400 });
  }

  // Fetch session data for context
  const { data: session } = await supabase
    .from("study_help_sessions")
    .select("data, title, course_id, courses(name)")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (!session) {
    return new Response("Session not found", { status: 404 });
  }

  const sessionData = session.data as StudyHelp;
  const courseName = (session.courses as unknown as { name: string } | null)?.name;

  // Build context from session
  const summaryContext = sessionData.summary.join("\n- ");
  const keyTermsContext = sessionData.keyTerms
    .map((kt) => `${kt.term}: ${kt.definition}`)
    .join("\n");

  const systemMessage = [
    "You are an AI tutor helping a college student study. Be encouraging, clear, and concise.",
    courseName ? `The student is studying: ${courseName}.` : "",
    "",
    "Use the following study material as context for your answers:",
    "",
    "## Summary",
    "- " + summaryContext,
    "",
    "## Key Terms",
    keyTermsContext,
    "",
    "Guidelines:",
    "- Answer questions about the study material",
    "- Explain concepts in different ways when asked",
    "- Give examples and analogies to aid understanding",
    "- If asked about something not in the material, say so and redirect to the study content",
    "- Do NOT write essays, complete assignments, or do homework for the student",
    "- Keep responses focused and under 300 words unless more detail is specifically requested",
  ].join("\n");

  // Save the user's latest message to the database
  const lastUserMsg = messages[messages.length - 1];
  if (lastUserMsg?.role === "user") {
    await supabase.from("tutor_messages").insert({
      user_id: user.id,
      session_id: sessionId,
      role: "user",
      content: lastUserMsg.content,
    });
  }

  try {
    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: systemMessage,
      messages,
      onFinish: async ({ text }) => {
        // Save assistant response
        await supabase.from("tutor_messages").insert({
          user_id: user.id,
          session_id: sessionId,
          role: "assistant",
          content: text,
        });
      },
    });

    return result.toTextStreamResponse();
  } catch (err) {
    const classified = classifyAIError(err);
    console.error("[tutor] AI error:", classified.type);
    return new Response(classified.userMessage, { status: 503 });
  }
}
