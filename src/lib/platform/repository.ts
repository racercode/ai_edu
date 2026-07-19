import { z } from "zod";
import type {
  Course,
  CourseDashboard,
  Enrollment,
  LearningEvent,
  TeacherMaterialPatch,
  User,
} from "@/types/platform";
import {
  courseSchema,
  enrollmentSchema,
  learningEventSchema,
  teacherMaterialPatchSchema,
  userSchema,
} from "@/types/platform";

const STORE_KEY = "adaptive-textbook:platform";
export const demoTeacherId = "teacher-ada";
export const demoCourseId = "geometry-foundations";

const storeSchema = z.object({
  users: z.array(userSchema),
  courses: z.array(courseSchema),
  enrollments: z.array(enrollmentSchema),
  events: z.array(learningEventSchema),
  teacherMaterialPatches: z.array(teacherMaterialPatchSchema),
});

type PlatformStore = z.infer<typeof storeSchema>;

export interface PlatformRepository {
  listCoursesForTeacher(teacherId: string): Promise<Course[]>;
  getCourseDashboard(courseId: string): Promise<CourseDashboard | null>;
  recordLearningEvent(event: LearningEvent): Promise<void>;
  listTeacherMaterialPatches(courseId: string, chapterId: string): Promise<TeacherMaterialPatch[]>;
  saveTeacherMaterialPatch(patch: TeacherMaterialPatch): Promise<void>;
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function seedStore(): PlatformStore {
  const enrolledAt = "2026-07-19T01:00:00.000Z";
  const users: User[] = [
    { id: demoTeacherId, displayName: "Ada Teacher", role: "teacher" },
    { id: "demo-student", displayName: "Demo Student", role: "student" },
    { id: "student-lin", displayName: "Lin", role: "student" },
    { id: "student-wei", displayName: "Wei", role: "student" },
  ];
  const courses: Course[] = [
    { id: demoCourseId, title: "Geometry Foundations", description: "Understand triangle area and perpendicular height.", teacherId: demoTeacherId, chapterId: "triangle-area" },
    { id: "triangle-practice", title: "Triangle Practice Lab", description: "Short review activities for triangle-area reasoning.", teacherId: demoTeacherId, chapterId: "triangle-area" },
  ];
  const enrollments: Enrollment[] = courses.flatMap((course) => users.filter((user) => user.role === "student").map((student) => ({
    id: `enrollment-${course.id}-${student.id}`,
    courseId: course.id,
    studentId: student.id,
    enrolledAt,
  })));
  const events: LearningEvent[] = [
    { id: "seed-lin-open", courseId: demoCourseId, chapterId: "triangle-area", studentId: "student-lin", type: "chapter-opened", occurredAt: "2026-07-19T08:30:00.000Z", conceptIds: [], payload: {} },
    { id: "seed-lin-quiz", courseId: demoCourseId, chapterId: "triangle-area", studentId: "student-lin", type: "quiz-answered", occurredAt: "2026-07-19T08:34:00.000Z", conceptIds: ["height_is_perpendicular"], payload: { quizId: "quiz-height", correct: true, conceptScores: { height_is_perpendicular: 0.75 } } },
    { id: "seed-wei-open", courseId: demoCourseId, chapterId: "triangle-area", studentId: "student-wei", type: "chapter-opened", occurredAt: "2026-07-19T09:15:00.000Z", conceptIds: [], payload: {} },
    { id: "seed-wei-question", courseId: demoCourseId, chapterId: "triangle-area", studentId: "student-wei", type: "tutor-questioned", occurredAt: "2026-07-19T09:17:00.000Z", conceptIds: ["triangle_area_formula"], payload: { conceptScores: { triangle_area_formula: 0.4 } } },
    { id: "seed-wei-quiz", courseId: demoCourseId, chapterId: "triangle-area", studentId: "student-wei", type: "quiz-answered", occurredAt: "2026-07-19T09:18:00.000Z", conceptIds: ["height_is_perpendicular"], payload: { quizId: "quiz-height", correct: false, conceptScores: { height_is_perpendicular: 0.35 } } },
  ];
  return { users, courses, enrollments, events, teacherMaterialPatches: [] };
}

function readStore(): PlatformStore {
  if (typeof window === "undefined") return seedStore();
  try {
    const value = localStorage.getItem(STORE_KEY);
    if (!value) {
      const seeded = seedStore();
      localStorage.setItem(STORE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return storeSchema.parse(JSON.parse(value));
  } catch {
    const seeded = seedStore();
    localStorage.setItem(STORE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function writeStore(store: PlatformStore) {
  if (typeof window !== "undefined") localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

function getDashboard(store: PlatformStore, courseId: string): CourseDashboard | null {
  const course = store.courses.find((item) => item.id === courseId);
  if (!course) return null;
  const studentIds = new Set(store.enrollments.filter((item) => item.courseId === courseId).map((item) => item.studentId));
  const students = store.users.filter((user) => user.role === "student" && studentIds.has(user.id)).map((student) => {
    const events = store.events.filter((event) => event.courseId === courseId && event.studentId === student.id);
    const quizEvents = events.filter((event) => event.type === "quiz-answered");
    const conceptScores: Record<string, number> = {};
    for (const event of events) {
      const scores = event.payload.conceptScores;
      if (!scores || typeof scores !== "object" || Array.isArray(scores)) continue;
      for (const [conceptId, value] of Object.entries(scores)) if (typeof value === "number") conceptScores[conceptId] = value;
    }
    return {
      student,
      quizAttempts: quizEvents.length,
      correctAnswers: quizEvents.filter((event) => event.payload.correct === true).length,
      conceptScores,
      lastActiveAt: events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0]?.occurredAt,
    };
  });
  return {
    course,
    students,
    recentEvents: store.events.filter((event) => event.courseId === courseId).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 12),
    publishedPatches: store.teacherMaterialPatches.filter((patch) => patch.courseId === courseId && patch.status === "published"),
  };
}

class LocalStoragePlatformRepository implements PlatformRepository {
  async listCoursesForTeacher(teacherId: string) {
    return readStore().courses.filter((course) => course.teacherId === teacherId);
  }

  async getCourseDashboard(courseId: string) {
    return getDashboard(readStore(), courseId);
  }

  async recordLearningEvent(event: LearningEvent) {
    const store = readStore();
    store.events.push(learningEventSchema.parse(event));
    writeStore(store);
  }

  async listTeacherMaterialPatches(courseId: string, chapterId: string) {
    return readStore().teacherMaterialPatches.filter((patch) => patch.courseId === courseId && patch.chapterId === chapterId && patch.status === "published");
  }

  async saveTeacherMaterialPatch(patch: TeacherMaterialPatch) {
    const store = readStore();
    const validated = teacherMaterialPatchSchema.parse(patch);
    const index = store.teacherMaterialPatches.findIndex((item) => item.id === patch.id);
    if (index >= 0) store.teacherMaterialPatches[index] = validated;
    else store.teacherMaterialPatches.push(validated);
    writeStore(store);
  }
}

export const platformRepository: PlatformRepository = new LocalStoragePlatformRepository();
export { createId };
