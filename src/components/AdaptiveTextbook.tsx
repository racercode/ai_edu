"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Chapter, ChatMessage, ContentPatch, PersonalizationResponse, StudentState, TutorResponse } from "@/types/contracts";
import { activePatches } from "@/lib/patch-renderer";
import { exportMarkdown } from "@/lib/export-markdown";
import { defaultStudentState, recordQuestion, recordQuizAnswer, shouldPersonalize } from "@/lib/learning-state";
import { loadLocal, resetLocal, saveLocal } from "@/lib/storage";
import { demoChapter } from "@/data/chapter.sample";
import { trackLearningEvent } from "@/lib/platform/learning-events";
import { demoCourseId, platformRepository } from "@/lib/platform/repository";
import type { TeacherMaterialPatch } from "@/types/platform";

type ApiResult<T> = T & { fallbackUsed?: boolean; error?: string };

async function post<T>(url: string, body: unknown): Promise<ApiResult<T>> {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "請求失敗");
  return data;
}

export default function AdaptiveTextbook() {
  const [chapter, setChapter] = useState<Chapter>(demoChapter);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [state, setState] = useState<StudentState>(defaultStudentState());
  const [patches, setPatches] = useState<ContentPatch[]>([]);
  const [teacherPatches, setTeacherPatches] = useState<TeacherMaterialPatch[]>([]);
  const [selectedId, setSelectedId] = useState("formula-area");
  const [view, setView] = useState<"original" | "personal">("personal");
  const [question, setQuestion] = useState("");
  const [loadingTutor, setLoadingTutor] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<Chapter | null>(null);
  const [tutorOpen, setTutorOpen] = useState(false);
  const ready = useRef(false);
  const blockRefs = useRef(new Map<string, HTMLElement>());

  useEffect(() => {
    const local = loadLocal();
    setChapter(local.chapter); setChat(local.chat); setState(local.state); setPatches(local.patches);
    setSelectedId(local.chapter.blocks.find((block) => block.id === "formula-area")?.id ?? local.chapter.blocks[0].id);
    ready.current = true;
  }, []);
  useEffect(() => { if (ready.current) saveLocal({ chapter, chat, state, patches }); }, [chapter, chat, state, patches]);
  useEffect(() => {
    let mounted = true;
    const loadTeacherPatches = async () => {
      const next = await platformRepository.listTeacherMaterialPatches(demoCourseId, chapter.id);
      if (mounted) setTeacherPatches(next);
    };
    void loadTeacherPatches();
    const refresh = () => { void loadTeacherPatches(); };
    window.addEventListener("adaptive-textbook:teacher-patches-changed", refresh);
    return () => { mounted = false; window.removeEventListener("adaptive-textbook:teacher-patches-changed", refresh); };
  }, [chapter.id]);
  useEffect(() => {
    if (ready.current) void trackLearningEvent({ chapterId: chapter.id, studentId: state.studentId, type: "chapter-opened", conceptIds: [], payload: {} });
  }, [chapter.id, state.studentId]);

  const patchMap = useMemo(() => {
    const map = new Map<string, ContentPatch[]>();
    if (view === "personal") for (const patch of activePatches(chapter, patches)) map.set(patch.targetBlockId, [...(map.get(patch.targetBlockId) ?? []), patch]);
    return map;
  }, [chapter, patches, view]);
  const teacherPatchMap = useMemo(() => {
    const map = new Map<string, TeacherMaterialPatch[]>();
    if (view === "personal") for (const patch of teacherPatches) map.set(patch.targetBlockId, [...(map.get(patch.targetBlockId) ?? []), patch]);
    return map;
  }, [teacherPatches, view]);
  const selected = chapter.blocks.find((block) => block.id === selectedId) ?? chapter.blocks[0]!;

  function selectBlock(id: string) {
    const block = chapter.blocks.find((item) => item.id === id);
    setSelectedId(id);
    if (block) void trackLearningEvent({ chapterId: chapter.id, studentId: state.studentId, type: "block-selected", conceptIds: block.conceptIds, payload: { blockId: id } });
  }
  function focusBlock(id: string) {
    setSelectedId(id); setTutorOpen(false);
    requestAnimationFrame(() => blockRefs.current.get(id)?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  async function askTutor() {
    if (!question.trim() || !selected) return;
    const content = question.trim(); const nextState = recordQuestion(state, selected.conceptIds);
    setQuestion(""); setChat((old) => [...old, { role: "student", content }]); setState(nextState); setLoadingTutor(true);
    try {
      void trackLearningEvent({ chapterId: chapter.id, studentId: nextState.studentId, type: "tutor-questioned", conceptIds: selected.conceptIds, payload: { currentBlockId: selected.id, conceptScores: Object.fromEntries(selected.conceptIds.map((conceptId) => [conceptId, nextState.concepts[conceptId]?.score ?? 0.6])) } });
      const answer = await post<TutorResponse>("/api/tutor", { chapter, currentBlockId: selected.id, question: content, history: chat.slice(-8), studentState: nextState });
      setChat((old) => [...old, { role: "tutor", content: answer.answer, referencedBlockIds: answer.referencedBlockIds }]);
      if (answer.fallbackUsed) setNotice("Demo fallback used：目前使用固定示範回覆。");
    } catch (error) { setNotice(error instanceof Error ? error.message : "導師暫時無法回應。"); } finally { setLoadingTutor(false); }
  }

  async function answerQuiz(quizId: string, option: number) {
    const quiz = chapter.quizzes.find((item) => item.id === quizId); if (!quiz) return;
    const nextState = recordQuizAnswer(state, quiz, option); const correct = option === quiz.correctOptionIndex;
    void trackLearningEvent({ chapterId: chapter.id, studentId: nextState.studentId, type: "quiz-answered", conceptIds: quiz.conceptIds, payload: { quizId, selectedOptionIndex: option, correct, conceptScores: Object.fromEntries(quiz.conceptIds.map((conceptId) => [conceptId, nextState.concepts[conceptId]?.score ?? 0.6])) } });
    setState(nextState); setNotice(correct ? "答對了！你的概念分數已提升。" : `還差一點：${quiz.explanation}`);
    if (!correct && shouldPersonalize(nextState, quiz.conceptIds[0])) {
      setUpdating(quiz.afterBlockId);
      try {
        const result = await post<PersonalizationResponse>("/api/personalize", { chapter, targetBlockId: quiz.afterBlockId, studentState: nextState, trigger: { type: "incorrect-answer", conceptId: quiz.conceptIds[0], misconception: quiz.misconceptionByOption?.[String(option)] } });
        setPatches((old) => [...old, ...result.patches]); void trackLearningEvent({ chapterId: chapter.id, studentId: nextState.studentId, type: "personalization-added", conceptIds: quiz.conceptIds, payload: { patchIds: result.patches.map((patch) => patch.id), conceptScores: Object.fromEntries(quiz.conceptIds.map((conceptId) => [conceptId, nextState.concepts[conceptId]?.score ?? 0.6])) } }); setView("personal");
        setNotice(result.fallbackUsed ? "教材已更新（Demo fallback used）。" : "教材已依你的回答更新。");
      } catch (error) { setNotice(error instanceof Error ? error.message : "教材更新失敗。"); } finally { setUpdating(null); }
    }
  }

  async function importPdf() {
    if (!file) return; setImporting(true); setNotice("");
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch("/api/import-pdf", { method: "POST", body: form }); const data = await response.json();
      if (!response.ok) throw new Error(data.error); setPreview(data.chapter);
    } catch (error) { setNotice(error instanceof Error ? error.message : "PDF 匯入失敗。"); } finally { setImporting(false); }
  }

  function confirmImport() {
    if (!preview) return;
    setChapter(preview); setChat([]); setState(defaultStudentState()); setPatches([]); setSelectedId(preview.blocks[0].id); setView("personal"); setPreview(null);
    setNotice("新教材已載入，可以開始學習。");
  }
  function download() {
    const blob = new Blob([exportMarkdown(chapter, patches)], { type: "text/markdown;charset=utf-8" }); const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${chapter.id}.md`; anchor.click(); URL.revokeObjectURL(url);
  }
  function reset() {
    resetLocal(); setChapter(demoChapter); setChat([]); setState(defaultStudentState()); setPatches([]); setSelectedId("formula-area"); setView("personal"); setNotice("已重設為三角形面積示範教材。");
  }

  return <main className="app-shell">
    <header className="app-header"><div><h1>Adaptive Textbook</h1><p className="muted">不是在教科書旁放聊天機器人，而是讓教材隨你演化。</p></div><div className="header-actions"><a className="button secondary" href="/teacher">Teacher dashboard</a><button className="button secondary" onClick={download}>匯出 Markdown</button><button className="button secondary" onClick={reset}>重設 Demo</button></div></header>
    {notice && <p role="status" className="notice">{notice}</p>}

    <section className="panel import-panel"><b>從 PDF 建立教材</b><p className="muted">僅支援可選取文字的 PDF，最多 10 MB、50 頁；原始檔不會保存。</p><div className="inline-actions"><input type="file" accept="application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><button className="button" disabled={!file || importing} onClick={importPdf}>{importing ? "正在轉換…" : "轉換並預覽"}</button></div></section>
    {preview && <section className="panel preview-panel"><h2>教材預覽：{preview.title}</h2><p>{preview.blocks.length} 個內容區塊、{preview.quizzes.length} 題測驗</p><ul>{preview.learningObjectives.map((item) => <li key={item}>{item}</li>)}</ul><div className="preview-content"><b>內容區塊</b>{preview.blocks.map((block) => <p key={block.id}>{block.content}</p>)}<b>測驗題目</b><ol>{preview.quizzes.map((quiz) => <li key={quiz.id}>{quiz.question}</li>)}</ol></div><div className="inline-actions"><button className="button" onClick={confirmImport}>開始學習這份教材</button><button className="button secondary" onClick={() => setPreview(null)}>取消</button></div></section>}

    <button className="button tutor-trigger" onClick={() => setTutorOpen(true)}>開啟 AI 導師</button>
    <div className="reader-grid">
      <aside className="panel chapter-sidebar"><p className="badge">{chapter.subject}</p><h2>{chapter.title}</h2><b>學習目標</b><ul className="muted">{chapter.learningObjectives.map((item) => <li key={item}>{item}</li>)}</ul><b>目前進度</b><p className="muted">已加入 {patches.length} 則個人化內容</p></aside>
      <section className="panel textbook-panel"><div className="textbook-heading"><h2>教科書</h2><div className="view-switch"><button className={`button ${view === "original" ? "" : "secondary"}`} onClick={() => setView("original")}>原始版</button><button className={`button ${view === "personal" ? "" : "secondary"}`} onClick={() => setView("personal")}>我的教材</button></div></div>
        {chapter.blocks.slice().sort((a, b) => a.order - b.order).map((block) => <div key={block.id} ref={(element) => { if (element) blockRefs.current.set(block.id, element); }}><article tabIndex={0} onClick={() => selectBlock(block.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectBlock(block.id); } }} className={`block ${block.id === selectedId ? "selected" : ""} ${block.type === "formula" ? "formula" : ""}`}><span className="block-label">{block.id === selectedId ? "目前選取" : "點選以詢問"}</span>{block.type === "heading" ? <h3>{block.content}</h3> : <p>{block.content}</p>}</article>
          {(teacherPatchMap.get(block.id) ?? []).map((patch) => <article className="teacher-material" key={patch.id}><span className="teacher-badge">Teacher material</span><b>{patch.title}</b><p>{patch.body}</p></article>)}
          {(patchMap.get(block.id) ?? []).map((patch) => <article className="patch" key={patch.id}><span className="badge">AI 為你加入</span><b>{patch.title}</b><p>{patch.body}</p></article>)}
          {updating === block.id && <p className="muted">正在更新你的教材…</p>}
          {chapter.quizzes.filter((quiz) => quiz.afterBlockId === block.id).map((quiz) => <Quiz key={quiz.id} quiz={quiz} onAnswer={answerQuiz} />)}
        </div>)}
        {patches.length > 0 && <button className="button secondary" onClick={() => setPatches((old) => old.slice(0, -1))}>復原最新 AI 補充</button>}
      </section>
      <TutorPanel className="desktop-tutor" selected={selected} chat={chat} question={question} loading={loadingTutor} onQuestionChange={setQuestion} onAsk={askTutor} onReference={focusBlock} />
    </div>
    {tutorOpen && <div className="tutor-drawer" role="dialog" aria-modal="true" aria-label="AI 導師"><div className="drawer-bar"><b>AI 導師</b><button className="button secondary" onClick={() => setTutorOpen(false)}>關閉</button></div><TutorPanel selected={selected} chat={chat} question={question} loading={loadingTutor} onQuestionChange={setQuestion} onAsk={askTutor} onReference={focusBlock} /></div>}
  </main>;
}

function TutorPanel({ className, selected, chat, question, loading, onQuestionChange, onAsk, onReference }: { className?: string; selected: Chapter["blocks"][number]; chat: ChatMessage[]; question: string; loading: boolean; onQuestionChange: (value: string) => void; onAsk: () => void; onReference: (id: string) => void }) {
  return <aside className={`panel tutor-panel ${className ?? ""}`}><h2>AI 導師</h2><p className="muted">目前段落：{selected.content}</p><div className="chat-log">{chat.length === 0 && <p className="muted">選取一段內容後，問我任何問題。</p>}{chat.map((message, index) => <div key={`${message.role}-${index}`} className={`chat-message ${message.role}`}><b>{message.role === "student" ? "你" : "導師"}</b><p>{message.content}</p>{message.referencedBlockIds?.length ? <div className="references"><span>參考段落：</span>{message.referencedBlockIds.map((id) => <button key={id} className="reference" onClick={() => onReference(id)}>{id}</button>)}</div> : null}</div>)}{loading && <p className="muted">導師正在思考…</p>}</div><div className="ask-row"><input aria-label="問題" value={question} onChange={(event) => onQuestionChange(event.target.value)} onKeyDown={(event) => event.key === "Enter" && onAsk()} placeholder="例如：為什麼要除以二？" /><button className="button" disabled={loading} onClick={onAsk}>送出</button></div></aside>;
}

function Quiz({ quiz, onAnswer }: { quiz: Chapter["quizzes"][number]; onAnswer: (quizId: string, option: number) => void }) {
  const [answered, setAnswered] = useState<number | null>(null);
  return <section className="quiz"><b>小測驗：{quiz.question}</b>{quiz.options.map((option, index) => <button className="option" key={option} disabled={answered !== null} onClick={() => { setAnswered(index); onAnswer(quiz.id, index); }}>{option}</button>)}{answered !== null && <p className={answered === quiz.correctOptionIndex ? "" : "muted"}>{answered === quiz.correctOptionIndex ? "答對了！" : quiz.explanation}</p>}</section>;
}
