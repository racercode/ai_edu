import { NextResponse } from "next/server";
import { z } from "zod";
import { chapterSchema, studentStateSchema, tutorResponseSchema } from "@/types/contracts";
import { mockTutor } from "@/lib/ai/mock";
import { isMockMode, structuredResponse } from "@/lib/ai/provider";

const requestSchema = z.object({ chapter: chapterSchema, currentBlockId: z.string(), question: z.string().trim().min(1).max(800), history: z.array(z.object({ role: z.enum(["student", "tutor"]), content: z.string() })).max(12), studentState: studentStateSchema });
export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    if (!body.chapter.blocks.some((block) => block.id === body.currentBlockId)) return NextResponse.json({ error: "找不到目前選取的教材區塊。" }, { status: 400 });
    if (isMockMode()) return NextResponse.json({ ...mockTutor(body.question), fallbackUsed: false });
    try {
      const response = await structuredResponse(tutorResponseSchema, "TutorResponse", "你是單一教材章節內的 AI 導師。只可依 supplied chapter 作答，用繁體中文、簡短且適合學生的說明。referencedBlockIds 必須是 supplied chapter 的既有區塊 ID。只輸出 JSON。", body);
      const validIds = new Set(body.chapter.blocks.map((block) => block.id));
      if (response.referencedBlockIds.some((id) => !validIds.has(id))) throw new Error("Model returned unknown block ID");
      return NextResponse.json({ ...response, fallbackUsed: false });
    } catch (error) {
      if ((process.env.NEXT_PUBLIC_DEMO_MODE ?? "auto") === "live") return NextResponse.json({ error: "AI 導師暫時無法回應。" }, { status: 503 });
      console.error("Tutor fallback", error); return NextResponse.json({ ...mockTutor(body.question), fallbackUsed: true });
    }
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "無效的請求" }, { status: 400 }); }
}
