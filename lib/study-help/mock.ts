import type { StudyHelp } from "./types";

// ---------------------------------------------------------------------------
// Deterministic mock study help — returned when OPENAI_API_KEY is not set
// ---------------------------------------------------------------------------

export function getMockStudyHelp(): StudyHelp {
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
        definition: "A placeholder definition demonstrating the expected format for key terms",
      },
      {
        term: "Sample Term 2",
        definition: "Another example definition showing how terms and definitions are paired",
      },
      {
        term: "Sample Term 3",
        definition: "A third example term with its corresponding definition for reference",
      },
    ],
    flashcards: [
      { front: "What is the main concept discussed in this material?", back: "The main concept is a placeholder representing the central theme of the content" },
      { front: "Define Sample Term 1", back: "A placeholder definition demonstrating the expected format for key terms" },
      { front: "What are the three key components?", back: "Component A, Component B, and Component C are the three key components" },
      { front: "How does concept A relate to concept B?", back: "Concept A provides the foundation upon which concept B is built" },
      { front: "What is the significance of this topic?", back: "This topic is significant because it connects multiple areas of study" },
      { front: "Name two real-world applications", back: "Application 1: Used in industry settings. Application 2: Applied in research contexts" },
      { front: "What year was this concept introduced?", back: "The concept was introduced as a placeholder date for demonstration purposes" },
      { front: "Compare the two main approaches", back: "Approach 1 focuses on theory while Approach 2 emphasizes practical application" },
      { front: "What is the formula for the key calculation?", back: "The formula is a placeholder representing the mathematical relationship" },
      { front: "Summarize the main argument", back: "The main argument posits that understanding fundamentals leads to better outcomes" },
    ],
    quiz: [
      {
        question: "What is the primary focus of the material?",
        options: ["Option A: Theory", "Option B: Practice", "Option C: History", "Option D: Application"],
        correctIndex: 0,
        explanation: "The material primarily focuses on theoretical foundations before moving to applications.",
      },
      {
        question: "Which term best describes the relationship between the concepts?",
        options: ["Causal", "Correlational", "Independent", "Inverse"],
        correctIndex: 1,
        explanation: "The concepts share a correlational relationship as demonstrated in the reading.",
      },
      {
        question: "How many key components are identified?",
        options: ["Two", "Three", "Four", "Five"],
        correctIndex: 1,
        explanation: "Three key components are identified and discussed throughout the material.",
      },
      {
        question: "What is the main takeaway from the material?",
        options: [
          "Understanding fundamentals is essential",
          "Practice is more important than theory",
          "Historical context is irrelevant",
          "Only one approach is correct",
        ],
        correctIndex: 0,
        explanation: "The material emphasizes that understanding fundamentals leads to better outcomes.",
      },
    ],
    practiceTest: [
      {
        question: "Explain the main concept and its significance in your own words.",
        type: "conceptual",
        suggestedAnswer: "The main concept involves understanding the foundational principles that underpin the broader topic, which is significant because it provides a framework for analyzing related issues.",
      },
      {
        question: "List and briefly describe the three key components discussed in the material.",
        type: "recall",
        suggestedAnswer: "1) Component A — provides the theoretical foundation. 2) Component B — offers practical applications. 3) Component C — connects theory to real-world contexts.",
      },
      {
        question: "How would you apply the concepts from this material to solve a real-world problem?",
        type: "application",
        suggestedAnswer: "One could apply these concepts by first identifying the relevant theoretical principles, then mapping them to the specific context of the problem, and finally implementing a solution that accounts for both practical and theoretical considerations.",
      },
      {
        question: "Compare and contrast the two main approaches described in the reading.",
        type: "conceptual",
        suggestedAnswer: "Approach 1 focuses on theoretical analysis and is more suitable for academic contexts, while Approach 2 emphasizes practical implementation and is preferred in industry settings. Both share a foundation in the core principles but differ in application method.",
      },
    ],
  };
}
