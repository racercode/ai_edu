export type ContentBlockType =
  | "heading"
  | "paragraph"
  | "formula"
  | "example"
  | "image-placeholder";

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  content: string;
  conceptIds: string[];
  order: number;
}

export interface QuizItem {
  id: string;
  afterBlockId: string;
  conceptIds: string[];
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  misconceptionByOption?: Record<number, string>;
}

export interface Chapter {
  id: string;
  title: string;
  subject: string;
  learningObjectives: string[];
  blocks: ContentBlock[];
  quizzes: QuizItem[];
}

export interface QuizAttempt {
  quizId: string;
  selectedOptionIndex: number;
  correct: boolean;
  misconception?: string;
  createdAt: string;
}

export interface ConceptState {
  conceptId: string;
  score: number;
  incorrectCount: number;
  questionCount: number;
  lastMisconception?: string;
}

export interface StudentState {
  studentId: string;
  concepts: Record<string, ConceptState>;
  recentAttempts: QuizAttempt[];
}

export type PatchContentType =
  | "note"
  | "explanation"
  | "example"
  | "practice-question";

export interface ContentPatch {
  id: string;
  targetBlockId: string;
  placement: "after";
  contentType: PatchContentType;
  title: string;
  body: string;
  conceptIds: string[];
  reason: string;
  createdAt: string;
  source: "ai" | "student";
}

export interface ChatMessage {
  id: string;
  role: "student" | "tutor" | "system";
  body: string;
  referencedBlockIds?: string[];
}
