import { describe, expect, it } from "vitest";
import { demoChapter } from "@/data/chapter.sample";
import { mockPersonalization, mockTutor } from "@/lib/ai/mock";
import { defaultStudentState } from "@/lib/learning-state";

describe("offline demo replies", () => {
  it("grounds tutor answers in known chapter blocks", () => {
    const response = mockTutor("為什麼要除以二？");
    expect(response.answer).toContain("一半");
    expect(response.referencedBlockIds).toContain("formula-area");
  });

  it("adds a reversible height explanation and practice question", () => {
    const response = mockPersonalization(demoChapter, defaultStudentState(), "height_is_perpendicular");
    expect(response.patches).toHaveLength(2);
    expect(response.patches.map((patch) => patch.contentType)).toEqual(["note", "practice-question"]);
  });
});
