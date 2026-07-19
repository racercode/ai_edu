"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { demoChapter } from "@/data/chapter.sample";
import { createId, demoCourseId, demoTeacherId, platformRepository } from "@/lib/platform/repository";
import type { Course, CourseDashboard, TeacherMaterialPatch } from "@/types/platform";

const patchTypes = ["note", "explanation", "example", "practice-question"] as const;

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function labelForEvent(type: string) {
  return ({
    "chapter-opened": "opened the chapter",
    "block-selected": "reviewed a section",
    "tutor-questioned": "asked the tutor a question",
    "quiz-answered": "answered a quiz",
    "personalization-added": "received personal learning material",
  } as Record<string, string>)[type] ?? type;
}

export default function TeacherDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState(demoCourseId);
  const [dashboard, setDashboard] = useState<CourseDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetBlockId, setTargetBlockId] = useState("formula-area");
  const [contentType, setContentType] = useState<(typeof patchTypes)[number]>("note");
  const [conceptId, setConceptId] = useState("height_is_perpendicular");
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  const refresh = useCallback(async (nextCourseId = courseId) => {
    setLoading(true);
    setError("");
    try {
      const [nextCourses, nextDashboard] = await Promise.all([
        platformRepository.listCoursesForTeacher(demoTeacherId),
        platformRepository.getCourseDashboard(nextCourseId),
      ]);
      setCourses(nextCourses);
      setDashboard(nextDashboard);
    } catch {
      setError("The teacher dashboard could not load. Try refreshing the page.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    const onChange = () => { void refresh(); };
    window.addEventListener("adaptive-textbook:learning-event", onChange);
    window.addEventListener("adaptive-textbook:teacher-patches-changed", onChange);
    return () => {
      window.removeEventListener("adaptive-textbook:learning-event", onChange);
      window.removeEventListener("adaptive-textbook:teacher-patches-changed", onChange);
    };
  }, [refresh]);

  const atRiskCount = useMemo(() => dashboard?.students.filter((student) => Object.values(student.conceptScores).some((score) => score < 0.45)).length ?? 0, [dashboard]);
  const conceptRows = useMemo(() => {
    const scores = new Map<string, number[]>();
    dashboard?.students.forEach((student) => Object.entries(student.conceptScores).forEach(([conceptId, score]) => scores.set(conceptId, [...(scores.get(conceptId) ?? []), score])));
    return [...scores.entries()].map(([conceptId, values]) => ({ conceptId, average: values.reduce((total, score) => total + score, 0) / values.length }));
  }, [dashboard]);

  async function selectCourse(nextCourseId: string) {
    setCourseId(nextCourseId);
    await refresh(nextCourseId);
  }

  async function savePatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dashboard || !title.trim() || !body.trim()) return;
    setSaving(true);
    setSavedMessage("");
    try {
      const now = new Date().toISOString();
      const patch: TeacherMaterialPatch = {
        id: createId("teacher-patch"),
        courseId: dashboard.course.id,
        chapterId: dashboard.course.chapterId,
        targetBlockId,
        placement: "after",
        contentType,
        title: title.trim(),
        body: body.trim(),
        conceptIds: [conceptId],
        authorId: demoTeacherId,
        createdAt: now,
        updatedAt: now,
        status: "published",
      };
      await platformRepository.saveTeacherMaterialPatch(patch);
      window.dispatchEvent(new Event("adaptive-textbook:teacher-patches-changed"));
      setTitle("");
      setBody("");
      setSavedMessage("Published to this course. Learners will see it after the target section.");
      await refresh();
    } catch {
      setError("The material could not be saved. Check the required fields and try again.");
    } finally {
      setSaving(false);
    }
  }

  return <main style={{ maxWidth: 1200, margin: "0 auto", padding: "1.25rem" }}>
    <header className="dashboard-header">
      <div><p className="eyebrow">Teacher workspace</p><h1>Course progress and material</h1><p className="muted">This dashboard is powered by learner events, not by direct calls to the AI tutor.</p></div>
      <label className="course-picker">Course<select value={courseId} onChange={(event) => { void selectCourse(event.target.value); }}>{courses.map((course) => <option value={course.id} key={course.id}>{course.title}</option>)}</select></label>
    </header>
    {error && <p className="panel error-panel" role="alert">{error}</p>}
    {loading && <p className="panel loading-panel">Loading course data…</p>}
    {!loading && !dashboard && <p className="panel loading-panel">No course data is available for this course.</p>}
    {!loading && dashboard && <>
      <section className="metric-grid" aria-label="Course summary">
        <Metric label="Enrolled learners" value={String(dashboard.students.length)} />
        <Metric label="At-risk learners" value={String(atRiskCount)} hint="Has a concept score below 45%" />
        <Metric label="Teacher materials" value={String(dashboard.publishedPatches.length)} />
        <Metric label="Recent events" value={String(dashboard.recentEvents.length)} />
      </section>
      <div className="teacher-grid">
        <section className="panel teacher-section"><h2>Learner progress</h2><div className="table-scroll"><table><thead><tr><th>Learner</th><th>Quiz accuracy</th><th>Concept signals</th><th>Last active</th></tr></thead><tbody>{dashboard.students.map((student) => <tr key={student.student.id}><td>{student.student.displayName}</td><td>{student.quizAttempts ? percent(student.correctAnswers / student.quizAttempts) : "—"}</td><td>{Object.entries(student.conceptScores).length ? Object.entries(student.conceptScores).map(([id, score]) => <span className={score < 0.45 ? "risk-chip" : "score-chip"} key={id}>{id.replaceAll("_", " ")}: {percent(score)}</span>) : "No scored concepts yet"}</td><td>{student.lastActiveAt ? new Date(student.lastActiveAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</td></tr>)}</tbody></table></div></section>
        <section className="panel teacher-section"><h2>Concept overview</h2>{conceptRows.length === 0 ? <p className="muted">Concept scores will appear after learners ask questions or answer quizzes.</p> : <div className="concept-list">{conceptRows.map((row) => <div key={row.conceptId}><div className="concept-label"><span>{row.conceptId.replaceAll("_", " ")}</span><b>{percent(row.average)}</b></div><div className="progress-track"><span style={{ width: percent(row.average) }} /></div></div>)}</div>}</section>
        <section className="panel teacher-section"><h2>Recent learner activity</h2>{dashboard.recentEvents.length === 0 ? <p className="muted">No activity has been recorded yet.</p> : <ol className="event-list">{dashboard.recentEvents.map((item) => <li key={item.id}><b>{dashboard.students.find((student) => student.student.id === item.studentId)?.student.displayName ?? item.studentId}</b> {labelForEvent(item.type)}<small>{new Date(item.occurredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></li>)}</ol>}</section>
        <section className="panel teacher-section"><h2>Publish teacher material</h2><p className="muted">This is course-wide material. It remains distinct from a learner’s personal AI additions.</p><form onSubmit={savePatch} className="teacher-form"><label>Target section<select value={targetBlockId} onChange={(event) => setTargetBlockId(event.target.value)}>{demoChapter.blocks.map((block) => <option value={block.id} key={block.id}>{block.id} — {block.content.slice(0, 45)}</option>)}</select></label><label>Material type<select value={contentType} onChange={(event) => setContentType(event.target.value as typeof contentType)}>{patchTypes.map((type) => <option value={type} key={type}>{type}</option>)}</select></label><label>Concept ID<select value={conceptId} onChange={(event) => setConceptId(event.target.value)}><option value="height_is_perpendicular">height_is_perpendicular</option><option value="triangle_area_formula">triangle_area_formula</option></select></label><label>Title<input value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Check the right angle" required /></label><label>Material<textarea value={body} maxLength={700} onChange={(event) => setBody(event.target.value)} placeholder="Write a concise, course-wide explanation or practice prompt." required /></label><button className="button" type="submit" disabled={saving}>{saving ? "Publishing…" : "Publish material"}</button></form>{savedMessage && <p className="success-message" role="status">{savedMessage}</p>}</section>
      </div>
      <section className="panel teacher-section" style={{ marginTop: "1rem" }}><h2>Published teacher material</h2>{dashboard.publishedPatches.length === 0 ? <p className="muted">No course-wide material has been published yet.</p> : <div className="teacher-patch-list">{dashboard.publishedPatches.map((patch) => <article className="teacher-patch" key={patch.id}><span className="teacher-badge">Teacher material</span><b>{patch.title}</b><p>{patch.body}</p><small>After {patch.targetBlockId} · {patch.contentType}</small></article>)}</div>}</section>
    </>}
  </main>;
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return <article className="panel metric"><span>{label}</span><b>{value}</b>{hint && <small>{hint}</small>}</article>;
}
