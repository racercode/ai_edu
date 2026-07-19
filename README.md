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

## TODO — Part 1：個人化學習體驗（負責人 A）

目標：讓單一學生從匯入教材、閱讀、提問、答題到取得個人化補充的流程可靠可展示。

- [ ] 完成 `npm run typecheck`、lint 與 production build，修正所有 SDK／Next.js 相容性問題。
- [ ] 補齊 Vitest：資料契約、學習分數、patch 合併與 Undo、Markdown、mock API。
- [ ] 補一套 Playwright 或可重複執行的瀏覽器 smoke test，覆蓋固定三分鐘 demo。
- [ ] 讓 Tutor 回覆中的引用可點選並自動捲動、聚焦到對應教材區塊。
- [ ] 加入真正的手機版 layout：Tutor 改底部抽屜，章節資訊收合，不維持桌面三欄。
- [ ] 將 OpenAI 的輸出 JSON Schema 改為完整、由 Zod 契約衍生的 strict schema；保留本地 Zod 驗證與一次重試。
- [ ] 在預覽畫面顯示生成的區塊與兩題測驗內容，讓使用者檢查後再開始學習。
- [ ] 強化 PDF 擷取的錯誤分類、頁數/檔案大小測試與文字品質提示；掃描檔持續明確拒絕（不導入 OCR）。
- [ ] 為 PDF 匯入加入 API、無 key、超限、掃描檔與模型無效輸出的自動化測試。
- [ ] 加入匯入中斷與重試 UX，並限制模型輸入長度時向使用者說明截斷狀態。

## TODO — Part 2：多人課程平台與教師端（負責人 B）

目標：讓教師可管理課程與學生，從學生的提問、測驗與概念弱點辨識教材痛點，並發布適用於全班的補充內容。

- [ ] 建立帳號與角色：學生、教師；限制教師端管理功能僅供教師使用。
- [x] 建立 MVP 資料 repository 與資料模型：`User`、`Course`、`Enrollment`、`LearningEvent`、`TeacherMaterialPatch`；目前以 localStorage 實作，保留替換資料庫的介面。
- [ ] 實作教師建立課程、建立班級、加入／移除學生，以及將章節教材指派給課程的流程。
- [x] 將學生的答題、提問、概念分數與個人化補充記錄為 `LearningEvent`，供課程層級彙整。
- [x] 建立 MVP 教師 dashboard：班級進度、低分概念、測驗正確率、近期學習活動與教材補充數量。
- [ ] 建立教材痛點頁面：依 concept ID、錯誤次數、分數與提問次數排序，讓教師找出需要改善的教材內容。
- [x] 讓教師建立並發布 `TeacherMaterialPatch`；學生閱讀器標示「Teacher material」，並與個人 AI patch 分開顯示。
- [ ] 在 Vercel 或目標部署環境驗證 Node runtime、PDF 套件、上傳 payload、資料庫連線與正式 OpenAI key 設定。

## 平行開發與整合規則

為避免兩位開發者互相阻塞，先凍結 `Chapter`、`QuizItem`、`ContentPatch` 以及 Tutor／Personalize API 回應契約。

- A 維護閱讀器、學生操作流程與既有 `/api/tutor`、`/api/personalize`；先使用 localStorage，但將讀寫抽成 service/repository 介面。
- B 建立帳號、課程、教師頁面與資料庫實作；不改動閱讀器元件或既有 AI endpoint 的回應格式。
- 整合時，A 將 localStorage 中的學習行為同步為 `LearningEvent`；B 的教師端以事件彙整教材痛點。
- `TeacherMaterialPatch` 沿用 patch 的插入方式，但需有教師來源與課程範圍；學生個人 AI patch 保持私有。
- 最後加入完整 demo 操作檢查表、教師端驗收情境與備援錄影。
