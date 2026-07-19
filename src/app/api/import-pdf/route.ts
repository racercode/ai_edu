import { NextResponse } from "next/server";
import { pdfImportResponseSchema } from "@/types/contracts";
import { structuredResponse } from "@/lib/ai/provider";

export const runtime = "nodejs";
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_PAGES = 50;

export async function POST(request: Request) {
  try {
    const form = await request.formData(); const file = form.get("file");
    if (!(file instanceof File) || file.type !== "application/pdf") return NextResponse.json({ error: "請選擇 PDF 檔案。" }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "PDF 不可超過 10 MB。" }, { status: 413 });
    const pdfParse = (await import("pdf-parse")).default;
    const parsed = await pdfParse(Buffer.from(await file.arrayBuffer()));
    if (parsed.numpages > MAX_PAGES) return NextResponse.json({ error: "PDF 不可超過 50 頁。" }, { status: 413 });
    const text = parsed.text.replace(/\s+/g, " ").trim();
    if (text.length < 200) return NextResponse.json({ error: "這份 PDF 沒有足夠可選取文字，掃描型 PDF 目前尚不支援。" }, { status: 422 });
    const result = await structuredResponse(pdfImportResponseSchema, "PdfImportResponse", "將 supplied PDF text 整理成一份繁體中文、單一章節的互動教材。輸出至少四個連續排序的 blocks、至少兩題四選一 quiz；所有 afterBlockId 必須對應既有 block。不要捏造 PDF 沒有的事實。只輸出 JSON。", { pdfText: text.slice(0, 100000) });
    return NextResponse.json({ ...result, extractedCharacterCount: text.length });
  } catch (error) { console.error("PDF import failed", error); return NextResponse.json({ error: error instanceof Error && error.message.includes("OPENAI_API_KEY") ? "PDF 匯入需要設定 OpenAI API key。" : "PDF 匯入失敗，請確認檔案是可讀取的文字型 PDF。" }, { status: 422 }); }
}
