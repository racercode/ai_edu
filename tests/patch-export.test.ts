import { describe, expect, it } from "vitest";
import { demoChapter } from "@/data/chapter.sample";
import { exportMarkdown } from "@/lib/export-markdown";
import { activePatches } from "@/lib/patch-renderer";
import type { ContentPatch } from "@/types/contracts";

const patch: ContentPatch = { id: "p1", targetBlockId: "formula-area", placement: "after", contentType: "explanation", title: "垂直高度", body: "高度要和底邊垂直。", conceptIds: ["height"], reason: "mistake", createdAt: "2026-01-01T00:00:00.000Z", source: "ai" };

describe("patch rendering and export", () => {
  it("renders only patches attached to the current immutable chapter", () => {
    expect(activePatches(demoChapter, [patch, { ...patch, id: "orphan", targetBlockId: "gone" }])).toEqual([patch]);
  });

  it("exports active personalized material to Markdown", () => {
    const output = exportMarkdown(demoChapter, [patch]);
    expect(output).toContain("# 三角形的面積");
    expect(output).toContain("### AI 為你加入：垂直高度");
    expect(output).not.toContain("orphan");
  });
});
