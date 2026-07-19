import { NextResponse } from "next/server";
import { z } from "zod";
import { chapterSchema, personalizationResponseSchema, studentStateSchema } from "@/types/contracts";
import { mockPersonalization } from "@/lib/ai/mock";
import { isMockMode, structuredResponse } from "@/lib/ai/provider";

const requestSchema = z.object({ chapter: chapterSchema, targetBlockId: z.string(), studentState: studentStateSchema, trigger: z.object({ type: z.literal("incorrect-answer"), conceptId: z.string(), misconception: z.string().optional() }) });
export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    if (!body.chapter.blocks.some((block) => block.id === body.targetBlockId)) return NextResponse.json({ error: "找不到要補充的教材位置。" }, { status: 400 });
    const fallback = () => mockPersonalization(body.chapter, body.studentState, body.trigger.conceptId);
    if (isMockMode()) return NextResponse.json({ ...fallback(), fallbackUsed: false });
    try {
      const response = await structuredResponse(personalizationResponseSchema, "PersonalizationResponse", "你會為學生的個人教材加入一或兩段繁體中文補充，但不可改寫原文。每段少於 100 字，直接處理學生的誤解，targetBlockId 必須是既有區塊。只輸出 JSON。", body);
      const ids = new Set(body.chapter.blocks.map((block) => block.id));
      if (response.patches.some((patch) => !ids.has(patch.targetBlockId))) throw new Error("Model returned unknown patch target");
      return NextResponse.json({ ...response, fallbackUsed: false });
    } catch (error) {
      if ((process.env.NEXT_PUBLIC_DEMO_MODE ?? "auto") === "live") return NextResponse.json({ error: "教材更新暫時失敗。" }, { status: 503 });
      console.error("Personalize fallback", error); return NextResponse.json({ ...fallback(), fallbackUsed: true });
    }
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "無效的請求" }, { status: 400 }); }
}
