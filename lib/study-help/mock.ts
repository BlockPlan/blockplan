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
    eli5Summary: [
      "Think of the main topic like a big puzzle — this piece shows you the picture on the box",
      "The subtopics are like ingredients in a recipe — they all work together to make something",
      "Some important dates and numbers are like passwords — you need to memorize them",
      "This stuff gets used in real life, like how math helps you split a pizza evenly",
      "The big takeaway is like the moral of a story — the main lesson to remember",
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
    eli5KeyTerms: [
      {
        term: "Sample Term 1",
        definition: "It's like a label you put on a jar so you know what's inside",
      },
      {
        term: "Sample Term 2",
        definition: "Think of it like a buddy system — two things that always go together",
      },
      {
        term: "Sample Term 3",
        definition: "It's like the third leg on a stool — it keeps everything balanced",
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
    practiceProblems: [
      {
        question: "Calculate the total cost of 3 textbooks priced at $45, $62, and $38, with a 10% student discount applied to the total.",
        difficulty: "easy",
        steps: [
          "Add up the individual textbook prices: $45 + $62 + $38 = $145",
          "Calculate the 10% discount: $145 × 0.10 = $14.50",
          "Subtract the discount from the total: $145 - $14.50 = $130.50",
        ],
        finalAnswer: "The total cost after the 10% student discount is $130.50.",
      },
      {
        question: "A study found that students who use active recall retain 75% of material after 1 week, while passive readers retain 40%. If both groups start with 200 facts, how many more facts does the active recall group remember?",
        difficulty: "medium",
        steps: [
          "Calculate facts retained by active recall group: 200 × 0.75 = 150 facts",
          "Calculate facts retained by passive reading group: 200 × 0.40 = 80 facts",
          "Find the difference: 150 - 80 = 70 facts",
        ],
        finalAnswer: "The active recall group remembers 70 more facts than the passive reading group.",
      },
      {
        question: "Analyze the time complexity of a nested loop where the outer loop runs n times and the inner loop runs from 1 to i (where i is the outer loop variable). Express in Big-O notation.",
        difficulty: "hard",
        steps: [
          "The outer loop runs n times (i = 1 to n)",
          "For each iteration i, the inner loop runs i times",
          "Total iterations = 1 + 2 + 3 + ... + n = n(n+1)/2",
          "Expand: n(n+1)/2 = (n² + n)/2",
          "In Big-O notation, we keep the dominant term: O(n²)",
        ],
        finalAnswer: "The time complexity is O(n²), which is quadratic.",
      },
      {
        question: "Convert the binary number 11010110 to decimal.",
        difficulty: "medium",
        steps: [
          "Write out the place values from right to left: 1, 2, 4, 8, 16, 32, 64, 128",
          "Multiply each digit by its place value: (1×128) + (1×64) + (0×32) + (1×16) + (0×8) + (1×4) + (1×2) + (0×1)",
          "Calculate: 128 + 64 + 0 + 16 + 0 + 4 + 2 + 0 = 214",
        ],
        finalAnswer: "The binary number 11010110 equals 214 in decimal.",
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
