import type { StudyAids } from "./types";

// ---------------------------------------------------------------------------
// Deterministic mock study aids — returned when OPENAI_API_KEY is not set
// ---------------------------------------------------------------------------

export function getMockStudyAids(): StudyAids {
  return {
    summary: [
      "Key concept 1: Overview of the main topic and its significance in the broader field",
      "Key concept 2: Important relationships between the primary subtopics discussed",
      "Key concept 3: Critical dates, figures, or formulas essential for understanding",
      "Key concept 4: Common applications and real-world examples of the material",
      "Key concept 5: Summary of major themes and takeaways from the content",
    ],
    keyTerms: [
      {
        term: "Sample Term 1",
        definition:
          "A placeholder definition demonstrating the expected format for key terms",
      },
      {
        term: "Sample Term 2",
        definition:
          "Another example definition showing how terms and definitions are paired",
      },
      {
        term: "Sample Term 3",
        definition:
          "A third example term with its corresponding definition for reference",
      },
    ],
    questions: [
      {
        question: "What are the main concepts covered in this material?",
        type: "recall",
      },
      {
        question: "How does concept A relate to concept B in the reading?",
        type: "conceptual",
      },
      {
        question: "List three key facts from the study material.",
        type: "recall",
      },
      {
        question:
          "Why is this topic significant in the broader context of the course?",
        type: "conceptual",
      },
      {
        question: "Define the primary term discussed in the notes.",
        type: "recall",
      },
      {
        question:
          "Compare and contrast the two main approaches described in the material.",
        type: "conceptual",
      },
      {
        question: "What evidence supports the main argument presented?",
        type: "recall",
      },
      {
        question:
          "How would you apply this concept to a new situation or problem?",
        type: "conceptual",
      },
    ],
  };
}
