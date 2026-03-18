import { z } from "zod";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { openai } from "@ai-sdk/openai";
import OpenAI from "openai";
import {
  studyHelpGenerationSchema,
  buildRegenerateSchema,
  type StudyHelp,
  type RegeneratableSection,
} from "./types";
import { getMockStudyHelp } from "./mock";

// Maximum characters for text content sent to the LLM
const MAX_TEXT_CHARS = 30_000;

// ---------------------------------------------------------------------------
// Content part types — supports multi-modal input (text + images)
// ---------------------------------------------------------------------------

export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image"; image: string }; // base64 data URL

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Generate comprehensive study help (summary, key terms, flashcards, quiz,
 * practice test) from multi-modal content.
 *
 * Feature-gated: returns deterministic mock output when OPENAI_API_KEY is
 * not set so the app functions without LLM integration.
 *
 * @param contentParts - Array of text and/or image content parts
 * @param courseName - Optional course name for context
 * @returns Study help data and whether mock mode was used
 */
export async function generateStudyHelp(
  contentParts: ContentPart[],
  courseName?: string
): Promise<{ data: StudyHelp; isMock: boolean }> {
  // Feature gate — no key, no LLM
  if (!process.env.OPENAI_API_KEY) {
    return { data: getMockStudyHelp(), isMock: true };
  }

  if (contentParts.length === 0) {
    return { data: getMockStudyHelp(), isMock: true };
  }

  const courseContext = courseName ? `Course: ${courseName}. ` : "";

  const sourceDescription = "text and/or images of textbook pages.";

  const systemMessage = [
    "You are a thorough, detailed study aid generator for college students preparing for exams.",
    courseContext,
    `Generate COMPREHENSIVE and DETAILED study materials from the provided ${sourceDescription}`,
    "",
    "IMPORTANT: Generate study aids only. Do not provide answers to graded assignments, write essays, or complete homework. Focus on comprehension, recall, and conceptual understanding.",
    "",
    "CRITICAL: Be THOROUGH and DETAILED. Students are using these to study for real exams. Do NOT oversimplify.",
    "- Summaries should capture ALL major ideas, not just the top-level overview",
    "- Key term definitions should be detailed enough to fully understand each concept (2-3 sentences each)",
    "- Flashcards should cover specific details, not just broad concepts",
    "- Quiz questions should test real understanding at exam level, not surface-level recall",
    "",
    "Generate ALL of the following:",
    "1. summary: 15-25 detailed bullet points that THOROUGHLY cover all major ideas, concepts, processes, relationships, and important details from the material. Each bullet should be specific and informative, not vague. Cover the breadth AND depth of the content.",
    "2. keyTerms: ALL important terms, concepts, and vocabulary from the material. Each definition should be 2-3 sentences explaining what it is, why it matters, and how it connects to other concepts. Do NOT write one-line oversimplified definitions.",
    "3. flashcards: 20-30 flashcards testing specific facts, concepts, definitions, processes, and relationships. Answers should be detailed enough to demonstrate real understanding. Cover ALL important topics from the material.",
    "4. quiz: 15-20 multiple-choice questions at varying difficulty levels, each with exactly 4 options, correctIndex (0-3), and a detailed explanation of why the correct answer is right and why incorrect options are wrong.",
    "5. practiceTest: 10-15 open-ended questions mixing recall, conceptual, and application types. Each suggestedAnswer should be a thorough model answer that would earn full marks on an exam.",
    "6. practiceProblems: 6-10 step-by-step problems with varying difficulty (easy, medium, hard). Each problem should have a question, a difficulty level, an array of detailed solution steps that walk through the problem, and a finalAnswer.",
    "7. eli5Summary: Rewrite each summary bullet point in extremely simple language using everyday analogies, as if explaining to someone with no background. Make it fun and relatable.",
    "8. eli5KeyTerms: For each key term, provide a simplified definition using everyday analogies and simple language a child could understand.",
  ].join("\n");

  // Truncate text parts to stay within context limits, keep image parts as-is
  const userParts = contentParts.map((part) => {
    if (part.type === "text") {
      return { type: "text" as const, text: part.text.slice(0, MAX_TEXT_CHARS) };
    }
    return part;
  });

  try {
    const { experimental_output } = await generateText({
      model: openai("gpt-4o-mini"),
      experimental_output: Output.object({ schema: studyHelpGenerationSchema }),
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userParts },
      ],
    });

    if (!experimental_output) {
      throw new Error("AI did not return structured output. Please try again.");
    }

    return { data: experimental_output, isMock: false };
  } catch (err) {
    if (err instanceof NoObjectGeneratedError) {
      console.warn("[generateStudyHelp] NoObjectGeneratedError");
      throw new Error("AI could not generate study materials from this content. Try providing more text or a different file.");
    }
    console.error("[generateStudyHelp] Unexpected error:", err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Regenerate specific sections with different questions
// ---------------------------------------------------------------------------

/**
 * Regenerate flashcards, quiz, and/or practice test for an existing session.
 * Uses the session's summary + key terms as source context, and instructs
 * the AI to produce different questions from the existing ones.
 */
export async function regenerateStudyHelp(
  existingData: StudyHelp,
  sections: RegeneratableSection[],
  courseName?: string
): Promise<{ data: Partial<StudyHelp>; isMock: boolean }> {
  if (!process.env.OPENAI_API_KEY) {
    const mock = getMockStudyHelp();
    const partial: Partial<StudyHelp> = {};
    for (const s of sections) partial[s] = mock[s] as never;
    return { data: partial, isMock: true };
  }

  const courseContext = courseName ? `Course: ${courseName}. ` : "";

  // Build context from existing summary + key terms
  const summaryText = existingData.summary.join("\n- ");
  const keyTermsText = existingData.keyTerms
    .map((kt) => `${kt.term}: ${kt.definition}`)
    .join("\n");

  // Build list of existing questions to avoid
  const existingQuestions: string[] = [];
  if (sections.includes("flashcards")) {
    existingData.flashcards.forEach((f) =>
      existingQuestions.push(`Flashcard: ${f.front}`)
    );
  }
  if (sections.includes("quiz")) {
    existingData.quiz.forEach((q) =>
      existingQuestions.push(`Quiz: ${q.question}`)
    );
  }
  if (sections.includes("practiceTest")) {
    existingData.practiceTest.forEach((q) =>
      existingQuestions.push(`Practice: ${q.question}`)
    );
  }
  if (sections.includes("practiceProblems")) {
    (existingData.practiceProblems ?? []).forEach((p) =>
      existingQuestions.push(`Problem: ${p.question}`)
    );
  }

  const sectionInstructions: string[] = [];
  if (sections.includes("flashcards")) {
    sectionInstructions.push(
      "flashcards: 20-30 NEW detailed flashcards with front (question/term) and back (thorough answer/definition). Cover different aspects of the material than the existing ones."
    );
  }
  if (sections.includes("quiz")) {
    sectionInstructions.push(
      "quiz: 15-20 NEW multiple-choice questions at exam level, each with exactly 4 options, correctIndex (0-3), and detailed explanation of why the answer is correct and why others are wrong"
    );
  }
  if (sections.includes("practiceTest")) {
    sectionInstructions.push(
      "practiceTest: 10-15 NEW open-ended questions mixing recall, conceptual, and application types. Each suggestedAnswer should be a thorough model answer worthy of full marks."
    );
  }
  if (sections.includes("practiceProblems")) {
    sectionInstructions.push(
      "practiceProblems: 6-10 NEW step-by-step problems with varying difficulty (easy, medium, hard), each with detailed solution steps and finalAnswer"
    );
  }

  const systemMessage = [
    "You are a study aid generator for college students.",
    courseContext,
    "Using the summary and key terms below as source material, generate NEW study questions.",
    "",
    "CRITICAL: Generate DIFFERENT questions from the existing ones listed below. Cover the same topics but ask about different aspects, use different phrasing, and test different details.",
    "",
    "IMPORTANT: Generate study aids only. Do not provide answers to graded assignments.",
    "",
    `Generate the following:\n${sectionInstructions.map((s, i) => `${i + 1}. ${s}`).join("\n")}`,
  ].join("\n");

  const userMessage = [
    "## Source Material\n",
    "### Summary\n- " + summaryText,
    "\n### Key Terms\n" + keyTermsText,
    "\n## Existing Questions (generate DIFFERENT ones)\n" +
      existingQuestions.join("\n"),
  ].join("\n");

  const schema = buildRegenerateSchema(sections);

  try {
    const { experimental_output } = await generateText({
      model: openai("gpt-4o-mini"),
      experimental_output: Output.object({ schema }),
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
    });

    if (!experimental_output) {
      const mock = getMockStudyHelp();
      const partial: Partial<StudyHelp> = {};
      for (const s of sections) partial[s] = mock[s] as never;
      return { data: partial, isMock: true };
    }

    return { data: experimental_output as Partial<StudyHelp>, isMock: false };
  } catch (err) {
    if (err instanceof NoObjectGeneratedError) {
      console.warn("[regenerateStudyHelp] NoObjectGeneratedError — returning mock");
    } else {
      console.error("[regenerateStudyHelp] Unexpected error:", err);
    }
    const mock = getMockStudyHelp();
    const partial: Partial<StudyHelp> = {};
    for (const s of sections) partial[s] = mock[s] as never;
    return { data: partial, isMock: true };
  }
}

// ---------------------------------------------------------------------------
// Generate ELI5 (Explain Like I'm 5) versions for existing sessions
// ---------------------------------------------------------------------------

const eli5Schema = z.object({
  eli5Summary: z.array(z.string()),
  eli5KeyTerms: z.array(z.object({ term: z.string(), definition: z.string() })),
});

export async function generateEli5(
  summary: string[],
  keyTerms: { term: string; definition: string }[],
  courseName?: string
): Promise<{ eli5Summary: string[]; eli5KeyTerms: { term: string; definition: string }[] }> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      eli5Summary: summary.map((s) => `Simple version: ${s}`),
      eli5KeyTerms: keyTerms.map((kt) => ({ term: kt.term, definition: `Simply put: ${kt.definition}` })),
    };
  }

  const courseContext = courseName ? `Course: ${courseName}. ` : "";

  const systemMessage = [
    "You are a friendly tutor who explains complex topics in the simplest possible way.",
    courseContext,
    "Rewrite the provided summary and key terms using:",
    "- Everyday language a 10-year-old could understand",
    "- Fun analogies and relatable examples",
    "- Short sentences, no jargon",
    "- Keep the same number of items as the original",
  ].join("\n");

  const userMessage = [
    "## Summary to simplify:\n" + summary.map((s, i) => `${i + 1}. ${s}`).join("\n"),
    "\n## Key Terms to simplify:\n" + keyTerms.map((kt) => `- ${kt.term}: ${kt.definition}`).join("\n"),
  ].join("\n");

  try {
    const { experimental_output } = await generateText({
      model: openai("gpt-4o-mini"),
      experimental_output: Output.object({ schema: eli5Schema }),
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
    });

    if (!experimental_output) {
      throw new Error("Failed to generate simplified content.");
    }

    return experimental_output;
  } catch (err) {
    console.error("[generateEli5] Error:", err);
    throw new Error("Failed to generate simplified explanations. Please try again.");
  }
}

// ---------------------------------------------------------------------------
// Generate Mermaid.js diagrams from study material
// ---------------------------------------------------------------------------

const diagramSchema = z.object({
  diagrams: z.array(
    z.object({
      type: z.enum(["mindmap", "flowchart", "conceptMap"]),
      title: z.string(),
      mermaidCode: z.string(),
    })
  ),
});

type DiagramTypeKey = "mindmap" | "flowchart" | "conceptMap";

export async function generateDiagrams(
  summary: string[],
  keyTerms: { term: string; definition: string }[],
  diagramType: DiagramTypeKey,
  courseName?: string
): Promise<{ diagrams: { type: DiagramTypeKey; title: string; mermaidCode: string }[] }> {
  if (!process.env.OPENAI_API_KEY) {
    return { diagrams: [getMockDiagram(diagramType)] };
  }

  const courseContext = courseName ? `Course: ${courseName}. ` : "";

  const typeInstructions: Record<DiagramTypeKey, string> = {
    mindmap: [
      "Generate a Mermaid.js mindmap diagram. Use the mindmap syntax.",
      "The root node should be the main topic. Branch into subtopics from the summary.",
      "Include key terms as leaf nodes where relevant.",
      "Example syntax:\nmindmap\n  root((Main Topic))\n    Subtopic A\n      Detail 1\n      Detail 2\n    Subtopic B",
    ].join(" "),
    flowchart: [
      "Generate a Mermaid.js flowchart using 'graph TD' (top-down).",
      "Connect related concepts with labeled arrows showing how ideas flow logically.",
      "Use summary points as major nodes and key terms as supporting nodes.",
    ].join(" "),
    conceptMap: [
      "Generate a Mermaid.js flowchart using 'graph LR' (left-right) styled as a concept map.",
      "Show relationships between key terms using labeled edges.",
      "Group related concepts together. Focus on how terms relate to each other.",
    ].join(" "),
  };

  const systemMessage = [
    "You are a visual learning aid generator for college students.",
    courseContext,
    "Generate a visual diagram in valid Mermaid.js syntax from the provided summary and key terms.",
    "",
    typeInstructions[diagramType],
    "",
    "CRITICAL RULES for valid Mermaid syntax:",
    "- NEVER use parentheses () in ANY node label text — they break Mermaid parsing. Write 'GTM' not '(GTM)', write 'eg sales' not '(e.g. sales)'",
    "- NEVER use square brackets [], curly braces {}, angle brackets <>, colons :, semicolons ;, or quotes in node labels",
    "- For flowchart/graph nodes, wrap labels in square brackets: A[Label Text Here]",
    "- For mindmap child nodes, use plain indented text only — NO brackets, NO parentheses, NO special punctuation",
    "- The ONLY place parentheses are allowed is the root node: root((Topic Name))",
    "- Keep labels concise (under 40 chars), use plain words only",
    "- Use simple alphanumeric node IDs (A, B, C or n1, n2, n3)",
    "- Do NOT include ```mermaid or ``` wrapper — return raw Mermaid syntax only",
    "- Ensure the diagram has 8-15 nodes for good visual density",
    "- If an acronym has parentheses like 'GTM (Go-To-Market)', write it as 'GTM - Go To Market' instead",
  ].join("\n");

  const userMessage = [
    "## Summary\n- " + summary.join("\n- "),
    "\n## Key Terms\n" + keyTerms.map((kt) => `${kt.term}: ${kt.definition}`).join("\n"),
  ].join("\n");

  try {
    const { experimental_output } = await generateText({
      model: openai("gpt-4o-mini"),
      experimental_output: Output.object({ schema: diagramSchema }),
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
    });

    if (!experimental_output) {
      throw new Error("Failed to generate diagram.");
    }

    // Override the type field — OpenAI may return the wrong enum value
    // (e.g. "flowchart" for a conceptMap since the prompt says "graph LR")
    const output = experimental_output as { diagrams: { type: DiagramTypeKey; title: string; mermaidCode: string }[] };
    return {
      diagrams: output.diagrams.map((d) => ({ ...d, type: diagramType })),
    };
  } catch (err) {
    console.error("[generateDiagrams] Error:", err);
    throw new Error("Failed to generate diagram. Please try again.");
  }
}

// ---------------------------------------------------------------------------
// Generate infographic (Visual Study Guide) from study material
// ---------------------------------------------------------------------------

const infographicContentSchema = z.object({
  title: z.string().describe("Main title for the study guide"),
  subtitle: z.string().describe("Brief subtitle or tagline"),
  colorTheme: z.string().describe("Primary color theme name: blue, green, purple, orange, red, teal, pink, or amber"),
  sections: z.array(
    z.object({
      title: z.string().describe("Section heading"),
      icon: z.string().describe("Single emoji representing this section"),
      color: z.string().describe("Color name: blue, green, purple, orange, red, teal, pink, or amber"),
      points: z.array(z.string()).describe("3-5 key points for this section"),
      highlight: z.string().describe("One important takeaway or fact to emphasize in this section"),
    })
  ).describe("3-6 main content sections"),
  keyTakeaway: z.string().describe("The single most important takeaway from all the material"),
  quickFacts: z.array(
    z.object({
      label: z.string().describe("Short label like 'Key Concept' or 'Remember'"),
      value: z.string().describe("The fact or value to highlight"),
    })
  ).describe("3-5 quick facts or statistics to display prominently"),
});

export type InfographicContent = z.infer<typeof infographicContentSchema>;

export async function generateInfographic(
  summary: string[],
  keyTerms: { term: string; definition: string }[],
  courseName?: string
): Promise<{ diagrams: { type: "infographic"; title: string; mermaidCode: string }[] }> {
  if (!process.env.OPENAI_API_KEY) {
    return { diagrams: [getMockInfographic()] };
  }

  const courseContext = courseName ? `Course: ${courseName}. ` : "";

  const systemMessage = [
    "You are a visual study guide designer for college students.",
    courseContext,
    "Create an engaging, well-organized visual study guide from the provided summary and key terms.",
    "",
    "Design the content to be visually appealing when rendered as a colorful infographic:",
    "- Choose a cohesive color theme that fits the subject matter",
    "- Create 3-6 logical sections that group related concepts",
    "- Each section should have an emoji icon, a distinct color, 3-5 bullet points, and one highlighted takeaway",
    "- Include 3-5 quick facts (short label + value pairs) for at-a-glance review",
    "- Write a single key takeaway that captures the most important idea",
    "- Use clear, concise language optimized for studying",
    "- Make section titles engaging and descriptive",
    "",
    "Available colors: blue, green, purple, orange, red, teal, pink, amber",
    "Use different colors for different sections to create visual variety.",
  ].join("\n");

  const userMessage = [
    "## Summary\n- " + summary.join("\n- "),
    "\n## Key Terms\n" + keyTerms.map((kt) => `${kt.term}: ${kt.definition}`).join("\n"),
  ].join("\n");

  try {
    const { experimental_output } = await generateText({
      model: openai("gpt-4o-mini"),
      experimental_output: Output.object({ schema: infographicContentSchema }),
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
    });

    if (!experimental_output) {
      throw new Error("Failed to generate study guide.");
    }

    return {
      diagrams: [{
        type: "infographic" as const,
        title: experimental_output.title,
        mermaidCode: JSON.stringify(experimental_output),
      }],
    };
  } catch (err) {
    console.error("[generateInfographic] Error:", err);
    throw new Error("Failed to generate study guide. Please try again.");
  }
}

function getMockInfographic(): { type: "infographic"; title: string; mermaidCode: string } {
  const content: InfographicContent = {
    title: "Study Guide Overview",
    subtitle: "Key concepts at a glance",
    colorTheme: "blue",
    sections: [
      {
        title: "Core Concepts",
        icon: "📚",
        color: "blue",
        points: ["Main idea from the material", "Supporting concept A", "Supporting concept B"],
        highlight: "This is the foundational concept everything builds upon",
      },
      {
        title: "Key Relationships",
        icon: "🔗",
        color: "green",
        points: ["Concept A relates to Concept B", "Cause and effect relationship", "Sequential dependency"],
        highlight: "Understanding these connections is crucial for exams",
      },
      {
        title: "Practical Applications",
        icon: "🎯",
        color: "purple",
        points: ["Real-world example 1", "Real-world example 2", "How to apply in practice"],
        highlight: "Focus on application-type questions",
      },
    ],
    keyTakeaway: "The most important thing to remember from this material",
    quickFacts: [
      { label: "Key Term", value: "Important definition" },
      { label: "Remember", value: "Critical fact for the exam" },
      { label: "Formula", value: "Key equation or rule" },
    ],
  };
  return {
    type: "infographic",
    title: content.title,
    mermaidCode: JSON.stringify(content),
  };
}

// ---------------------------------------------------------------------------
// Generate AI illustration (visualize concept or clean up hand-drawn image)
// ---------------------------------------------------------------------------

export async function generateIllustration(
  mode: "cleanup" | "visualize",
  input: string, // text concept for visualize, or base64 data URL for cleanup
  context?: { summary?: string[]; courseName?: string }
): Promise<{ imageBase64: string }> {
  if (!process.env.OPENAI_API_KEY) {
    // Return a placeholder SVG as base64 for mock mode
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect fill="#f0f0f0" width="400" height="400"/><text x="200" y="200" text-anchor="middle" fill="#999" font-size="16">AI Illustration (mock)</text></svg>`;
    const b64 = Buffer.from(svg).toString("base64");
    return { imageBase64: `data:image/svg+xml;base64,${b64}` };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  if (mode === "visualize") {
    // Build a descriptive prompt from the user's concept + session context
    const contextStr = context?.summary?.length
      ? `\n\nContext from study material:\n- ${context.summary.slice(0, 5).join("\n- ")}`
      : "";
    const courseStr = context?.courseName ? ` for a ${context.courseName} course` : "";

    const prompt = [
      `Create a clear, professional educational diagram or illustration${courseStr} that visually explains the following concept:`,
      `"${input}"`,
      "",
      "Style: Clean, colorful educational illustration suitable for a textbook or study guide. Use labels, arrows, and clear visual hierarchy. No text walls — focus on visual explanation.",
      contextStr,
    ].join("\n");

    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: "1024x1024",
    });

    const imageData = response.data?.[0];
    if (!imageData?.b64_json) {
      throw new Error("AI did not return an image. Please try again.");
    }

    return { imageBase64: `data:image/png;base64,${imageData.b64_json}` };
  } else {
    // Cleanup mode — redraw the hand-drawn image professionally
    // Extract raw base64 from data URL
    const base64Match = input.match(/^data:image\/[^;]+;base64,(.+)$/);
    if (!base64Match) {
      throw new Error("Invalid image format. Please upload a PNG or JPG image.");
    }

    const imageBuffer = Buffer.from(base64Match[1], "base64");
    const imageFile = new File([imageBuffer], "drawing.png", { type: "image/png" });

    const prompt = [
      "Redraw this hand-drawn illustration as a clean, professional, colorful educational diagram.",
      "Preserve the original layout, labels, and structure, but make it look polished and textbook-quality.",
      "Use clear lines, proper shapes, readable labels, and a professional color scheme.",
      "Keep all the information from the original drawing — just make it look professional.",
    ].join(" ");

    const response = await client.images.edit({
      model: "gpt-image-1",
      image: imageFile,
      prompt,
      n: 1,
      size: "1024x1024",
    });

    const imageData = response.data?.[0];
    if (!imageData?.b64_json) {
      throw new Error("AI could not process the image. Please try again.");
    }

    return { imageBase64: `data:image/png;base64,${imageData.b64_json}` };
  }
}

function getMockDiagram(type: DiagramTypeKey): { type: DiagramTypeKey; title: string; mermaidCode: string } {
  const mocks: Record<DiagramTypeKey, { type: DiagramTypeKey; title: string; mermaidCode: string }> = {
    mindmap: {
      type: "mindmap",
      title: "Topic Overview",
      mermaidCode: `mindmap
  root((Main Topic))
    Concept A
      Detail 1
      Detail 2
    Concept B
      Detail 3
      Detail 4
    Concept C
      Detail 5`,
    },
    flowchart: {
      type: "flowchart",
      title: "Concept Flow",
      mermaidCode: `graph TD
    A[Main Concept] --> B[Sub Concept 1]
    A --> C[Sub Concept 2]
    B --> D[Detail 1]
    B --> E[Detail 2]
    C --> F[Detail 3]
    D --> G[Conclusion]
    E --> G
    F --> G`,
    },
    conceptMap: {
      type: "conceptMap",
      title: "Concept Relationships",
      mermaidCode: `graph LR
    A[Term 1] -->|relates to| B[Term 2]
    B -->|depends on| C[Term 3]
    A -->|contrasts with| C
    C -->|leads to| D[Term 4]
    D -->|supports| A`,
    },
  };
  return mocks[type];
}
