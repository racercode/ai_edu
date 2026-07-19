import type { LearningEvent, LearningEventType } from "@/types/platform";
import { demoCourseId, platformRepository } from "./repository";

type EventInput = Omit<LearningEvent, "id" | "occurredAt" | "courseId"> & { courseId?: string };

function createEventId() {
  return `event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function trackLearningEvent(input: EventInput): Promise<void> {
  const event: LearningEvent = {
    ...input,
    id: createEventId(),
    courseId: input.courseId ?? demoCourseId,
    occurredAt: new Date().toISOString(),
  };
  await platformRepository.recordLearningEvent(event);
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent<LearningEvent>("adaptive-textbook:learning-event", { detail: event }));
}

export function isLearningEventType(value: string): value is LearningEventType {
  return ["chapter-opened", "block-selected", "tutor-questioned", "quiz-answered", "personalization-added"].includes(value);
}
