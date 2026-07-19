"use client";

import { useMemo, useRef, useState } from "react";
import type { Chapter, ContentPatch, PersonalizationResponse } from "@/types/contracts";
import { defaultStudentState, recordQuizAnswer } from "@/lib/learning-state";
import { demoChapter } from "@/data/chapter.sample";

type ClassNote = { id: number; excerpt: string; body: string };
const classmates = ["我把底邊想成地面，高就是垂直落下的距離。", "不要看哪一邊比較長，要先找 90 度。", "換一條底邊時，高也要跟著換。"];

async function personalize(chapter: Chapter, option: number) {
  const quiz = chapter.quizzes.find((item) => item.id === "quiz-height")!;
  const studentState = recordQuizAnswer(defaultStudentState(), quiz, option);
  const response = await fetch("/api/personalize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chapter, targetBlockId: "height-definition", studentState, trigger: { type: "incorrect-answer", conceptId: "height_is_perpendicular", misconception: quiz.misconceptionByOption?.[String(option)] } }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "AI 暫時無法判讀。");
  return data as PersonalizationResponse;
}

export default function AdaptiveTextbook() {
  const [chapter] = useState(demoChapter);
  const [notes, setNotes] = useState<ClassNote[]>([]);
  const [selection, setSelection] = useState("");
  const [noteText, setNoteText] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [loading, setLoading] = useState(false);
  const [patches, setPatches] = useState<ContentPatch[]>([]);
  const [highlight, setHighlight] = useState(false);
  const heightRef = useRef<HTMLElement>(null);
  const quiz = chapter.quizzes.find((item) => item.id === "quiz-height")!;

  const aiNote = useMemo(() => patches.find((patch) => patch.contentType !== "practice-question"), [patches]);
  function captureSelection() {
    const text = window.getSelection()?.toString().trim() ?? "";
    if (text.length > 1) { setSelection(text); setNoteOpen(true); }
  }
  function addNote() {
    if (!noteText.trim()) return;
    setNotes((old) => [...old, { id: Date.now(), excerpt: selection, body: noteText.trim() }]);
    setNoteText(""); setNoteOpen(false); window.getSelection()?.removeAllRanges();
  }
  async function answer(option: number) {
    if (option === quiz.correctOptionIndex) return;
    setWrong(true); setLoading(true); setHighlight(false);
    try { const result = await personalize(chapter, option); setPatches((old) => [...old, ...result.patches]); }
    catch { setPatches([{ id: "local-height-note", targetBlockId: "height-definition", placement: "after", contentType: "explanation", title: "垂直高度", body: "你把斜邊當成高度了。高度必須和選定的底邊形成 90 度。", conceptIds: ["height_is_perpendicular"], reason: "斜邊誤用", createdAt: new Date().toISOString(), source: "ai" }]); }
    finally { setLoading(false); }
  }
  function goToConcept() { heightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); heightRef.current?.focus(); }

  return <main className="book-shell" onMouseUp={captureSelection}>
    <header className="book-masthead"><span>數學 · 第 1 章</span><h1>{chapter.title}</h1><span>p. 12</span></header>
    <div className="book-layout">
      <aside className="book-margin"><p>本章目標</p><ol>{chapter.learningObjectives.map((objective) => <li key={objective}>{objective}</li>)}</ol><p className="margin-rule">閱讀時可圈選文字，加入自己的共筆。</p></aside>
      <article className="textbook-page">
        <p className="chapter-kicker">CHAPTER ONE</p>
        <h2>從平行四邊形理解三角形</h2>
        <p>兩個全等三角形可以拼成一個底和垂直高相同的平行四邊形。<Marker index={0} /></p>
        <figure className="formula-card"><figcaption>面積公式</figcaption><strong>面積 = 1/2 × 底 × 高</strong><small>同一個平行四邊形可分成兩個全等三角形。</small></figure>
        <section ref={heightRef} tabIndex={-1} className={`concept-section ${highlight ? "highlighted" : ""}`}><p className="concept-label">重點觀念 02</p><h3>高度必須垂直於底邊</h3><p><mark>高是從選定的底邊到對面頂點的垂直距離，必須和底邊形成 90 度。</mark><Marker index={1} /></p>{highlight && <p className="highlight-caption">AI 已標記：先確認 90 度，再判斷哪一條是高。</p>}</section>
        {aiNote && <aside className="student-note"><span>AI 為你新增的筆記</span><h3>{aiNote.title}</h3><p>{aiNote.body}</p></aside>}
        <section className="quiz-sheet"><p className="quiz-number">CHECKPOINT</p><h3>{quiz.question}</h3>{quiz.options.map((option, index) => <button key={option} className="answer-choice" onClick={() => answer(index)} disabled={wrong}>{String.fromCharCode(65 + index)}. {option}</button>)}
          {wrong && <div className="mistake-feedback"><p><b>這題的正確答案是：</b>{quiz.options[quiz.correctOptionIndex]}</p><p>AI 判讀：你可能把「連接頂點的邊」誤認為高度；真正的高度要與底邊垂直。</p><div><button onClick={goToConcept}>前往對應觀念</button><button className="ink-button" onClick={() => setHighlight(true)} disabled={loading}>{loading ? "AI 正在生成筆記…" : "一鍵畫重點"}</button></div></div>}
        </section>
        {notes.length > 0 && <section className="my-notes"><h3>我的共筆</h3>{notes.map((note) => <p key={note.id}><q>{note.excerpt}</q> — {note.body}</p>)}</section>}
      </article>
      <aside className="annotation-rail"><h2>共筆</h2><p>滑過正文的圓點，看看同學怎麼想。</p>{notes.length ? <p className="note-count">你已加入 {notes.length} 則註記</p> : null}</aside>
    </div>
    {noteOpen && <aside className="selection-panel" role="dialog"><button className="close-note" onClick={() => setNoteOpen(false)}>關閉</button><p>你圈選了：<q>{selection}</q></p><textarea value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="寫下你的理解或提問…" /><button onClick={addNote}>加入共筆</button></aside>}
  </main>;
}

function Marker({ index }: { index: number }) { return <span className="note-marker" tabIndex={0}>✦<span className="note-popover">同學共筆：{classmates[index]}</span></span>; }
