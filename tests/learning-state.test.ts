import { describe, expect, it } from "vitest";
import { demoChapter } from "@/data/chapter.sample";
import { defaultStudentState, recordQuestion, recordQuizAnswer, shouldPersonalize } from "@/lib/learning-state";

describe("learning state", () => {
  it("updates scores transparently for correct and incorrect answers", () => {
    const quiz = demoChapter.quizzes[0];
    const wrong = recordQuizAnswer(defaultStudentState(), quiz, 0);
    const concept = wrong.concepts[quiz.conceptIds[0]];
    expect(concept).toMatchObject({ score: 0.35, incorrectCount: 1, questionCount: 1 });
    const correct = recordQuizAnswer(wrong, quiz, quiz.correctOptionIndex);
    expect(correct.concepts[quiz.conceptIds[0]].score).toBeCloseTo(0.5);
  });

  it("triggers personalization after the first low-score height mistake", () => {
    const quiz = demoChapter.quizzes[0];
    const state = recordQuizAnswer(defaultStudentState(), quiz, 0);
    expect(shouldPersonalize(state, quiz.conceptIds[0])).toBe(true);
  });

  it("records a question against every selected concept", () => {
    const state = recordQuestion(defaultStudentState(), ["base", "height"]);
    expect(state.concepts.base.questionCount).toBe(1);
    expect(state.concepts.height.score).toBeCloseTo(0.55);
  });
});
