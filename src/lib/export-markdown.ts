import type { Chapter, ContentPatch } from "@/types/contracts";
import { activePatches } from "./patch-renderer";

export function exportMarkdown(chapter: Chapter, patches: ContentPatch[]) {
  const byTarget = new Map<string, ContentPatch[]>(); for (const patch of activePatches(chapter, patches)) byTarget.set(patch.targetBlockId, [...(byTarget.get(patch.targetBlockId) ?? []), patch]);
  const lines = [`# ${chapter.title}`, "", ...chapter.learningObjectives.map((x) => `- ${x}`), ""];
  for (const block of [...chapter.blocks].sort((a, b) => a.order - b.order)) { lines.push(block.type === "heading" ? `## ${block.content}` : block.type === "formula" ? `> **${block.content}**` : block.content, ""); for (const patch of byTarget.get(block.id) ?? []) lines.push(`### AI 為你加入：${patch.title}`, "", patch.body, ""); }
  return lines.join("\n");
}
