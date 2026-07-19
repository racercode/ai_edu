# Adaptive Textbook

繁體中文的互動教科書 MVP：學生閱讀一個章節、向 AI 導師提問、完成嵌入式測驗，並在出現誤解時獲得插入個人教材的補充內容。

## 快速開始

```bash
npm install
cp .env.example .env.local
npm run dev
```

`NEXT_PUBLIC_DEMO_MODE=mock` 可完全離線展示固定的三角形面積情境；`auto` 會在 OpenAI 無法使用時退回 mock。PDF 匯入則需要伺服器端 `OPENAI_API_KEY`。

## 已完成

- 單章閱讀器、區塊選取、Tutor 對話、兩題三角形面積測驗
- 學習分數、個人化教材 patch、原始／個人教材切換、Undo、Markdown 匯出與 Reset
- `mock`、`live`、`auto` API 模式與 server-only OpenAI key
- 文字型 PDF 上傳、文字擷取、AI 教材轉換與確認後載入

## TODO — Part 1：核心 Demo 穩定化

- [ ] 完成 `npm run typecheck`、lint 與 production build，修正所有 SDK／Next.js 相容性問題。
- [ ] 補齊 Vitest：資料契約、學習分數、patch 合併與 Undo、Markdown、mock API。
- [ ] 補一套 Playwright 或可重複執行的瀏覽器 smoke test，覆蓋固定三分鐘 demo。
- [ ] 讓 Tutor 回覆中的引用可點選並自動捲動、聚焦到對應教材區塊。
- [ ] 加入真正的手機版 layout：Tutor 改底部抽屜，章節資訊收合，不維持桌面三欄。
- [ ] 將 OpenAI 的輸出 JSON Schema 改為完整、由 Zod 契約衍生的 strict schema；保留本地 Zod 驗證與一次重試。

## TODO — Part 2：PDF 匯入與上線整合

- [ ] 在預覽畫面顯示生成的區塊與兩題測驗內容，讓使用者檢查後再開始學習。
- [ ] 強化 PDF 擷取的錯誤分類、頁數/檔案大小測試與文字品質提示；掃描檔持續明確拒絕（不導入 OCR）。
- [ ] 為 PDF 匯入加入 API、無 key、超限、掃描檔與模型無效輸出的自動化測試。
- [ ] 加入匯入中斷與重試 UX，並限制模型輸入長度時向使用者說明截斷狀態。
- [ ] 在 Vercel 或目標部署環境驗證 Node runtime、PDF 套件與上傳 payload 限制；不保存原始 PDF。
- [ ] 建立 demo 操作檢查表、備援錄影與正式 OpenAI key 的部署設定。
