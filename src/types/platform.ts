import { z } from "zod";

export const userRoleSchema = z.enum(["student", "teacher"]);
export const userSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  role: userRoleSchema,
});

export const courseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  teacherId: z.string().min(1),
  chapterId: z.string().min(1),
});

export const enrollmentSchema = z.object({
  id: z.string().min(1),
  courseId: z.string().min(1),
  studentId: z.string().min(1),
  enrolledAt: z.string(),
});

export const learningEventTypeSchema = z.enum([
  "chapter-opened",
  "block-selected",
  "tutor-questioned",
  "quiz-answered",
  "personalization-added",
]);

export const learningEventSchema = z.object({
  id: z.string().min(1),
  courseId: z.string().min(1),
  chapterId: z.string().min(1),
  studentId: z.string().min(1),
  type: learningEventTypeSchema,
  occurredAt: z.string(),
  conceptIds: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({}),
});

export const teacherMaterialPatchSchema = z.object({
  id: z.string().min(1),
  courseId: z.string().min(1),
  chapterId: z.string().min(1),
  targetBlockId: z.string().min(1),
  placement: z.literal("after"),
  contentType: z.enum(["note", "explanation", "example", "practice-question"]),
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(700),
  conceptIds: z.array(z.string()).min(1),
  authorId: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
  status: z.enum(["published", "archived"]),
});

export type User = z.infer<typeof userSchema>;
export type Course = z.infer<typeof courseSchema>;
export type Enrollment = z.infer<typeof enrollmentSchema>;
export type LearningEvent = z.infer<typeof learningEventSchema>;
export type LearningEventType = z.infer<typeof learningEventTypeSchema>;
export type TeacherMaterialPatch = z.infer<typeof teacherMaterialPatchSchema>;

export interface StudentProgress {
  student: User;
  quizAttempts: number;
  correctAnswers: number;
  conceptScores: Record<string, number>;
  lastActiveAt?: string;
}

export interface CourseDashboard {
  course: Course;
  students: StudentProgress[];
  recentEvents: LearningEvent[];
  publishedPatches: TeacherMaterialPatch[];
}
