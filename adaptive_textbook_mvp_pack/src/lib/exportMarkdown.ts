import type { Chapter, ContentPatch } from "@/types/contracts";

export function buildPersonalizedMarkdown(chapter: Chapter, patches: ContentPatch[]) {
  const lines: string[] = [`# ${chapter.title}`, "", `Subject: ${chapter.subject}`, ""];

  for (const block of chapter.blocks) {
    if (block.type === "heading") {
      lines.push(`## ${block.content}`, "");
    } else if (block.type === "formula") {
      lines.push("```text", block.content, "```", "");
    } else {
      lines.push(block.content, "");
    }

    const attachedPatches = patches.filter((patch) => patch.targetBlockId === block.id);
    for (const patch of attachedPatches) {
      lines.push(`### AI added for you: ${patch.title}`, patch.body, "");
    }
  }

  return lines.join("\n");
}
