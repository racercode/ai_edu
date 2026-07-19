# 一鍵錄影使用說明

## 前置條件

先讓前端網站跑起來，例如：

```powershell
npm run build
npm run start -- --hostname 127.0.0.1 --port 3000
```

確認瀏覽器可開：

```text
http://127.0.0.1:3000
```

## 錄製影片

在專案根目錄執行：

```powershell
npm run record:demo
```

或指定網址與輸出檔：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/record-demo-video.ps1 -Url http://127.0.0.1:3000 -Output output/demo-video/adaptive-textbook-demo.webm
```

## 產出

錄影檔會輸出到：

```text
output/demo-video/adaptive-textbook-demo.webm
```

同時會輸出幾張關鍵畫面截圖：

```text
output/demo-video/01-opening.png
output/demo-video/02-peer-notes.png
output/demo-video/03-wrong-answer.png
output/demo-video/04-jump-concept.png
output/demo-video/05-ai-highlight-note.png
```

## 轉成 MP4

如果需要 MP4，可以用 ffmpeg：

```powershell
ffmpeg -i output/demo-video/adaptive-textbook-demo.webm -c:v libx264 -pix_fmt yuv420p output/demo-video/adaptive-textbook-demo.mp4
```

## 腳本會做的事

1. 開啟學生課本頁面
2. 清除 localStorage，回到乾淨 demo 狀態
3. 錄下原始課本畫面
4. hover 共筆標記
5. 固定選錯 B
6. 顯示正解、跳到對應觀念
7. 一鍵化重點並加入 AI 個人筆記
8. 儲存影片和關鍵畫面

如果前端按鈕文字有改，請同步更新 `scripts/record-demo-video.ps1` 裡的按鈕名稱。
