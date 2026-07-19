import type { QuizItem, StudentState } from "@/types/contracts";

export const defaultStudentState = (): StudentState => ({ studentId: "demo-student", concepts: {}, recentAttempts: [] });
const initial = (conceptId: string) => ({ conceptId, score: 0.6, incorrectCount: 0, questionCount: 0 });

export function recordQuizAnswer(state: StudentState, quiz: QuizItem, selectedOptionIndex: number): StudentState {
  const correct = selectedOptionIndex === quiz.correctOptionIndex;
  const concepts = { ...state.concepts };
  for (const conceptId of quiz.conceptIds) {
    const old = concepts[conceptId] ?? initial(conceptId);
    concepts[conceptId] = { ...old, score: Math.max(0, Math.min(1, old.score + (correct ? 0.15 : -0.25))), questionCount: old.questionCount + 1, incorrectCount: old.incorrectCount + (correct ? 0 : 1), lastMisconception: correct ? old.lastMisconception : quiz.misconceptionByOption?.[String(selectedOptionIndex)] };
  }
  return { ...state, concepts, recentAttempts: [...state.recentAttempts.slice(-9), { quizId: quiz.id, selectedOptionIndex, correct, createdAt: new Date().toISOString() }] };
}

export function recordQuestion(state: StudentState, conceptIds: string[]): StudentState {
  const concepts = { ...state.concepts };
  for (const conceptId of conceptIds) { const old = concepts[conceptId] ?? initial(conceptId); concepts[conceptId] = { ...old, score: Math.max(0, old.score - 0.05), questionCount: old.questionCount + 1 }; }
  return { ...state, concepts };
}

export function shouldPersonalize(state: StudentState, conceptId: string) { const concept = state.concepts[conceptId]; return Boolean(concept && (concept.score < 0.45 || concept.incorrectCount >= 2)); }
