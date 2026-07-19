import type { Chapter, ContentPatch } from "@/types/contracts";

export function activePatches(chapter: Chapter, patches: ContentPatch[]) { const ids = new Set(chapter.blocks.map((b) => b.id)); return patches.filter((patch) => ids.has(patch.targetBlockId)); }
