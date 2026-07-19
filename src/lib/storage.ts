import type { Chapter, ChatMessage, ContentPatch, StudentState } from "@/types/contracts";
import { demoChapter } from "@/data/chapter.sample";
import { defaultStudentState } from "./learning-state";

const keys = { chapter: "adaptive-textbook:chapter", chat: "adaptive-textbook:chat", state: "adaptive-textbook:student-state", patches: "adaptive-textbook:patches" };
function read<T>(key: string, fallback: T): T { if (typeof window === "undefined") return fallback; try { return JSON.parse(localStorage.getItem(key) ?? "") as T; } catch { return fallback; } }
export const loadLocal = () => ({ chapter: read<Chapter>(keys.chapter, demoChapter), chat: read<ChatMessage[]>(keys.chat, []), state: read<StudentState>(keys.state, defaultStudentState()), patches: read<ContentPatch[]>(keys.patches, []) });
export const saveLocal = (data: { chapter: Chapter; chat: ChatMessage[]; state: StudentState; patches: ContentPatch[] }) => { localStorage.setItem(keys.chapter, JSON.stringify(data.chapter)); localStorage.setItem(keys.chat, JSON.stringify(data.chat)); localStorage.setItem(keys.state, JSON.stringify(data.state)); localStorage.setItem(keys.patches, JSON.stringify(data.patches)); };
export const resetLocal = () => { Object.values(keys).forEach((key) => localStorage.removeItem(key)); };
