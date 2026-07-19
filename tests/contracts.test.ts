import { describe, expect, it } from "vitest";
import { chapterSchema, contentPatchSchema, tutorResponseSchema } from "@/types/contracts";
import { demoChapter } from "@/data/chapter.sample";

describe("shared contracts", () => {
  it("accepts the fixed demo chapter", () => {
    expect(chapterSchema.parse(demoChapter)).toEqual(demoChapter);
  });

  it("rejects a quiz whose answer is outside its options", () => {
    const invalid = structuredClone(demoChapter);
    invalid.quizzes[0].correctOptionIndex = invalid.quizzes[0].options.length;
    expect(() => chapterSchema.parse(invalid)).toThrow("correctOptionIndex");
  });

  it("keeps AI patches bounded and tutor references explicit", () => {
    expect(() => contentPatchSchema.parse({ id: "p", targetBlockId: "b", placement: "after", contentType: "note", title: "t", body: "x".repeat(701), conceptIds: ["c"], reason: "r", createdAt: new Date().toISOString(), source: "ai" })).toThrow();
    expect(tutorResponseSchema.parse({ answer: "說明", referencedBlockIds: ["formula-area"], conceptSignals: [], suggestPersonalization: false }).referencedBlockIds).toEqual(["formula-area"]);
  });
});
