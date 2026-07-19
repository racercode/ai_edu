import type { ChatMessage, ContentPatch, StudentState } from "@/types/contracts";

export const initialStudentState: StudentState = {
  studentId: "demo",
  concepts: {
    triangle_area_formula: {
      conceptId: "triangle_area_formula",
      score: 0.6,
      incorrectCount: 0,
      questionCount: 0
    },
    height_is_perpendicular: {
      conceptId: "height_is_perpendicular",
      score: 0.6,
      incorrectCount: 0,
      questionCount: 0
    }
  },
  recentAttempts: []
};

export const openingMessages: ChatMessage[] = [
  {
    id: "opening",
    role: "tutor",
    body: "Select a section and ask a question. I will answer only from this chapter.",
    referencedBlockIds: []
  }
];

export const tutorAnswer: ChatMessage = {
  id: "answer-divide-by-two",
  role: "tutor",
  body:
    "A triangle is half of a matching parallelogram. Two identical triangles can make that parallelogram, so one triangle uses half of base x height.",
  referencedBlockIds: ["parallelogram-explanation", "formula-area"]
};

export const personalizationPatches: ContentPatch[] = [
  {
    id: "patch-height-note",
    targetBlockId: "formula-area",
    placement: "after",
    contentType: "note",
    title: "Remember: height must be perpendicular",
    body:
      "The height is the straight distance from the base to the opposite vertex. It has to meet the base at a 90-degree angle, even when a slanted side looks longer.",
    conceptIds: ["height_is_perpendicular"],
    reason: "Generated after an incorrect answer using the slanted side as height.",
    createdAt: "2026-07-19T12:00:00.000Z",
    source: "ai"
  },
  {
    id: "patch-height-visual",
    targetBlockId: "formula-area",
    placement: "after",
    contentType: "explanation",
    title: "Look for the right angle",
    body:
      "For any chosen base, imagine dropping a straight line down from the top vertex. That line is the height because it is perpendicular to the base.",
    conceptIds: ["height_is_perpendicular"],
    reason: "Generated to clarify the perpendicular-height misconception.",
    createdAt: "2026-07-19T12:00:01.000Z",
    source: "ai"
  },
  {
    id: "patch-height-practice",
    targetBlockId: "formula-area",
    placement: "after",
    contentType: "practice-question",
    title: "Try one easier check",
    body:
      "If the base is the bottom side, should you use a slanted side or the straight line that makes a 90-degree angle with the base?",
    conceptIds: ["height_is_perpendicular"],
    reason: "Generated as a lower-stakes follow-up question.",
    createdAt: "2026-07-19T12:00:02.000Z",
    source: "ai"
  }
];
