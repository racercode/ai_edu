# Adaptive Textbook MVP — Hackathon Project Specification

**Version:** 1.0  
**Team:** 2 Coding + 2 Demo/Product  
**Primary goal:** Build a reliable end-to-end demo in which one textbook chapter changes according to a student's questions and quiz performance.

---

## 1. Product statement

> We are not putting a chatbot beside a textbook. We are making the textbook evolve with the student.

The MVP contains one short, pre-structured chapter. A student can:

1. read the chapter;
2. ask an AI tutor questions about the current section;
3. answer embedded multiple-choice questions;
4. receive personalized notes, explanations, examples, or new practice questions;
5. see those additions inserted into a personal version of the chapter;
6. switch between the original and personalized versions;
7. export the personalized chapter as Markdown.

The project prioritizes a convincing feature demo over infrastructure completeness.

---

## 2. MVP scope

### 2.1 Must-have features

- Load one pre-structured chapter from a local JSON file.
- Render the chapter as blocks with stable `blockId` values.
- Let the student select or focus on a block and ask the AI tutor a question.
- Send the full chapter, current block, recent conversation, and student state directly to the LLM.
- Return an answer with references to one or more chapter blocks.
- Include at least two multiple-choice questions in the chapter.
- Record whether the student answered correctly.
- When the student answers incorrectly or repeatedly asks about a concept, generate a `ContentPatch`.
- Insert the generated patch after the relevant block in the personalized view.
- Persist chat history, learning state, and patches in browser `localStorage`.
- Provide an Original / My Textbook toggle.
- Provide Undo for the latest generated patch.
- Export the personalized chapter as Markdown.
- Provide deterministic mock responses when the LLM API is unavailable.

### 2.2 Explicit non-goals

Do **not** implement the following during the hackathon:

- PDF parsing or OCR
- embeddings or vector databases
- RAG pipelines
- knowledge graphs or GNNs
- user authentication
- databases or cloud persistence
- Open edX, LTI, xAPI servers, or LMS integration
- real-time collaboration
- peer annotation or peer scoring
- multi-chapter navigation
- automatic high-quality PDF re-layout
- a full Bayesian Knowledge Tracing model

These may appear in the pitch as future work, but they must not enter the critical path.

---

## 3. Demo success story

The entire demo should follow one fixed scenario:

1. The student opens a chapter on **triangle area**.
2. The student reads the formula `A = 1/2 × base × height`.
3. The student asks: “Why do we divide by two?”
4. The tutor answers using the chapter and references the relevant block.
5. The student answers a question incorrectly because they use the slanted side instead of the perpendicular height.
6. The system identifies the misconception `height_is_perpendicular`.
7. The system inserts after the formula block:
   - a personalized note;
   - a short visual-style explanation in text;
   - an easier follow-up question.
8. The student switches to **My Textbook** and sees the new material.
9. The student exports the personalized chapter as Markdown.

The demo is successful only if this entire path works without manual data editing.

---

## 4. Technical architecture

Use one repository and one deployable web application.

### 4.1 Recommended stack

- **Framework:** Next.js with TypeScript
- **UI:** Tailwind CSS
- **Validation:** Zod
- **State persistence:** browser `localStorage`
- **LLM access:** server-side API routes
- **Testing:** Vitest for utilities, Playwright or a manual smoke checklist for the main flow
- **Deployment:** Vercel or local laptop demo

Do not introduce additional services unless required by the event environment.

### 4.2 High-level flow

```text
chapter.sample.json
        |
        v
Textbook Reader -----------------------> localStorage
        |                                   | chat history
        | current block                     | learning state
        v                                   | content patches
AI Tutor API                               |
        | full chapter context             |
        v                                   |
LLM structured response ------------------+
        |
        v
Personalized textbook renderer
```

### 4.3 Why no RAG

The chapter is deliberately small enough to fit directly in the model context. The request contains:

- all chapter blocks;
- the current block;
- the last few chat messages;
- the student's concept state;
- recent quiz attempts.

This keeps the architecture understandable, fast to implement, and easy to debug.

---

## 5. Repository structure

```text
adaptive-textbook/
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── api/
│   │   │   ├── tutor/route.ts
│   │   │   └── personalize/route.ts
│   │   └── globals.css
│   ├── components/
│   │   ├── ChapterSidebar.tsx
│   │   ├── TextbookReader.tsx
│   │   ├── ContentBlockView.tsx
│   │   ├── PersonalizedPatchCard.tsx
│   │   ├── TutorPanel.tsx
│   │   ├── QuizCard.tsx
│   │   └── ViewModeToggle.tsx
│   ├── data/
│   │   └── chapter.sample.json
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── prompts.ts
│   │   │   ├── provider.ts
│   │   │   └── mock.ts
│   │   ├── exportMarkdown.ts
│   │   ├── learningState.ts
│   │   ├── patchRenderer.ts
│   │   └── storage.ts
│   └── types/
│       └── contracts.ts
├── demo/
│   ├── demo-script.md
│   ├── expected-responses.md
│   └── backup-recording/
├── docs/
│   ├── architecture.md
│   └── api-contracts.md
├── AGENTS.md
├── SPEC.md
└── README.md
```

### File ownership

- **Coding 1 owns:** `src/app/api`, `src/lib/ai`, `src/types`, AI-related tests.
- **Coding 2 owns:** `src/app/page.tsx`, `src/components`, `src/lib/storage.ts`, `src/lib/patchRenderer.ts`, export and UI tests.
- **Demo 1 owns:** `src/data/chapter.sample.json`, `demo/expected-responses.md`, product acceptance checks.
- **Demo 2 owns:** `demo/demo-script.md`, pitch materials, screenshots, backup recording.

Only `src/types/contracts.ts` is shared-critical. Freeze it early and change it only through a reviewed PR.

---

## 6. Core data contracts

All AI responses must be validated with Zod before being used by the UI.

### 6.1 Chapter

```ts
export interface Chapter {
  id: string;
  title: string;
  subject: string;
  learningObjectives: string[];
  blocks: ContentBlock[];
  quizzes: QuizItem[];
}
```

### 6.2 ContentBlock

```ts
export type ContentBlockType =
  | "heading"
  | "paragraph"
  | "formula"
  | "example"
  | "image-placeholder";

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  content: string;
  conceptIds: string[];
  order: number;
}
```

### 6.3 QuizItem

```ts
export interface QuizItem {
  id: string;
  afterBlockId: string;
  conceptIds: string[];
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  misconceptionByOption?: Record<number, string>;
}
```

### 6.4 StudentState

```ts
export interface ConceptState {
  conceptId: string;
  score: number; // 0 to 1
  incorrectCount: number;
  questionCount: number;
  lastMisconception?: string;
}

export interface StudentState {
  studentId: string;
  concepts: Record<string, ConceptState>;
  recentAttempts: QuizAttempt[];
}
```

Use a transparent heuristic rather than BKT:

```text
initial concept score = 0.60
correct answer          +0.15
incorrect answer        -0.25
asks for explanation    -0.05
score is clamped to [0, 1]
```

### 6.5 ContentPatch

```ts
export type PatchContentType =
  | "note"
  | "explanation"
  | "example"
  | "practice-question";

export interface ContentPatch {
  id: string;
  targetBlockId: string;
  placement: "after";
  contentType: PatchContentType;
  title: string;
  body: string;
  conceptIds: string[];
  reason: string;
  createdAt: string;
  source: "ai" | "student";
}
```

The original chapter is immutable. Personalized content is always stored as patches.

---

## 7. API contracts

### 7.1 `POST /api/tutor`

Use this when the student asks a question.

#### Request

```json
{
  "chapter": { "id": "triangle-area", "blocks": [] },
  "currentBlockId": "formula-area",
  "question": "Why do we divide by two?",
  "history": [],
  "studentState": { "studentId": "demo", "concepts": {} }
}
```

#### Response

```json
{
  "answer": "A triangle with the same base and height is half of the matching parallelogram, so its area is divided by two.",
  "referencedBlockIds": ["formula-area", "example-parallelogram"],
  "conceptSignals": [
    {
      "conceptId": "triangle_area_formula",
      "signal": "needs-explanation",
      "confidence": 0.82
    }
  ],
  "suggestPersonalization": false
}
```

Rules:

- Answer only from the supplied chapter.
- Keep the response concise and age appropriate.
- Never invent a block ID.
- If the answer is not in the chapter, say so clearly.
- Return valid JSON only.

### 7.2 `POST /api/personalize`

Use this after a wrong answer or when the learner state crosses a threshold.

#### Trigger

Call the endpoint when either condition is true:

```text
concept score < 0.45
OR
same concept incorrectCount >= 2
```

#### Request

```json
{
  "chapter": { "id": "triangle-area", "blocks": [] },
  "targetBlockId": "formula-area",
  "studentState": {},
  "trigger": {
    "type": "incorrect-answer",
    "conceptId": "height_is_perpendicular",
    "misconception": "Student used the slanted side as height."
  }
}
```

#### Response

```json
{
  "patches": [
    {
      "id": "patch-height-note",
      "targetBlockId": "formula-area",
      "placement": "after",
      "contentType": "note",
      "title": "Remember: height must be perpendicular",
      "body": "The height is the shortest straight distance from the base to the opposite vertex. It forms a 90-degree angle with the base.",
      "conceptIds": ["height_is_perpendicular"],
      "reason": "Generated after an incorrect answer using the slanted side as height.",
      "createdAt": "2026-07-19T12:00:00Z",
      "source": "ai"
    }
  ]
}
```

Rules:

- Return at most two patches.
- Keep each patch under 100 words.
- Target an existing block.
- Prefer one explanation and one practice question.
- Do not rewrite or delete original content.

---

## 8. AI prompt requirements

### 8.1 Tutor system prompt

```text
You are an AI tutor inside a single textbook chapter.
Use only the supplied chapter content.
Answer at the student's level using short, concrete explanations.
Reference existing block IDs that support the answer.
Do not claim that the textbook says something that is absent.
Return JSON matching the TutorResponse schema.
```

### 8.2 Personalization system prompt

```text
You personalize a textbook without modifying the original text.
Given a student misconception and the chapter blocks, generate one or two small additions.
Each addition must target an existing block and use one of the permitted content types.
Focus directly on the student's misconception.
Do not repeat the original paragraph verbatim.
Return JSON matching the PersonalizationResponse schema.
```

### 8.3 Reliability requirements

- Set a low temperature.
- Validate output with Zod.
- Retry once when validation fails.
- If the second attempt fails, return a deterministic mock result.
- Log validation errors on the server, not in the student UI.
- Never expose the API key to the browser.

---

## 9. Frontend behavior

### 9.1 Main layout

Desktop:

```text
┌───────────────┬────────────────────────────┬──────────────────┐
│ Chapter info  │ Textbook reader            │ AI Tutor         │
│               │                            │                  │
│ Objectives    │ Original content           │ Chat history     │
│ Concepts      │ Personalized patches       │ Message input    │
│ Progress      │ Embedded quizzes           │ Send button      │
└───────────────┴────────────────────────────┴──────────────────┘
```

Mobile:

- Reader is the main view.
- Tutor opens as a drawer or bottom sheet.
- Chapter information collapses into a top panel.

### 9.2 Required interactions

- Clicking a block marks it as the current context.
- The selected block has a visible but subtle highlight.
- Tutor answers show “Based on section …” references that scroll to the block.
- A wrong quiz answer shows the original explanation immediately.
- Personalization runs after the feedback is shown.
- Generated content appears with an “AI added for you” badge.
- The latest generated patch has an Undo action.
- Original view hides all patches but does not delete them.
- Personalized view merges patches after their target blocks.
- Export creates a `.md` file in the browser.

### 9.3 Loading and failure states

- Tutor request: show typing indicator.
- Personalization request: show “Updating your textbook…” near the target block.
- API failure: use mock result and display a small “Demo fallback used” badge.
- Invalid target block: ignore the patch and log the error.
- Empty local state: load the default demo student.

---

## 10. Local persistence

Use three localStorage keys:

```text
adaptive-textbook:chat
adaptive-textbook:student-state
adaptive-textbook:patches
```

Add a **Reset Demo** button that clears only these keys and reloads the default scenario.

No account system is required.

---

## 11. Mock fallback

The project must remain demoable without network access.

The mock layer recognizes the fixed demo scenario:

| Input | Mock output |
|---|---|
| “Why do we divide by two?” | Half-parallelogram explanation |
| Wrong answer using slanted side | Perpendicular-height note + easier practice question |
| Correct follow-up answer | Positive feedback and concept score increase |

The mock response must follow exactly the same schema as the real endpoint.

Environment switch:

```text
NEXT_PUBLIC_DEMO_MODE=mock | live | auto
```

- `mock`: always use fixtures.
- `live`: require LLM API.
- `auto`: use live API, fall back to mock on failure.

Default for the event: `auto`.

---

## 12. Team responsibilities

### Coding 1 — AI and server logic

Deliverables:

- contracts and Zod schemas;
- `/api/tutor`;
- `/api/personalize`;
- LLM provider wrapper;
- prompt templates;
- retry and fallback logic;
- learning-score utility;
- unit tests for schema validation and scoring.

Definition of done:

- endpoints return valid contract-compliant JSON;
- no API key appears in client code;
- fixed demo inputs work in `mock`, `live`, and `auto` modes;
- invalid LLM output cannot crash the UI.

### Coding 2 — UI and integration

Deliverables:

- responsive reader layout;
- block selection;
- tutor panel;
- quiz interaction;
- localStorage state;
- patch insertion and undo;
- Original / My Textbook toggle;
- Markdown export;
- Reset Demo;
- integration smoke test.

Definition of done:

- the full demo flow works from a clean browser;
- UI works with mock API before live integration;
- state survives refresh;
- reset returns the product to the scripted opening state.

### Demo 1 — Content and product QA

Deliverables:

- final chapter JSON;
- two or three high-quality multiple-choice questions;
- concept and misconception labels;
- expected AI answers;
- acceptance-test checklist;
- concise product copy;
- bug reproduction notes for coders.

This member reviews every feature from the learner's perspective and decides whether the output is understandable.

### Demo 2 — Pitch and presentation

Deliverables:

- three-minute demo script;
- slide deck;
- one architecture diagram;
- before/after screenshots;
- backup screen recording;
- final live-demo operator checklist;
- likely judge questions and answers.

This member ensures the technical work is translated into a clear product story.

---

## 13. GitHub workflow

### Branches

```text
main
├── feat/ai-api
├── feat/reader-ui
├── demo/content
└── demo/pitch
```

### Rules

- Protect `main` from direct pushes.
- Require one review for contract or API changes.
- Keep PRs below roughly 400 changed lines when practical.
- Merge working vertical slices early; do not wait until the end.
- Do not combine refactoring with a demo-critical feature.
- Every PR must include manual test steps.

### Contract freeze

Within the first 90 minutes, merge:

- `contracts.ts`;
- sample chapter JSON;
- mock API responses;
- empty UI shell that consumes those responses.

After that point, contract changes require both coders to approve.

---

## 14. GitHub issue plan

### P0 — required for demo

1. Scaffold Next.js app and add shared contracts.
2. Add sample chapter and quiz data.
3. Implement reader and block selection.
4. Implement mock tutor endpoint.
5. Implement tutor chat UI.
6. Implement quiz scoring and student state.
7. Implement mock personalization endpoint.
8. Render and persist `ContentPatch` objects.
9. Add original/personalized toggle and undo.
10. Add live LLM provider with auto fallback.
11. Add Markdown export and Reset Demo.
12. Run and record full demo rehearsal.

### P1 — only after P0 is stable

- streaming tutor responses;
- student-created notes;
- animated patch insertion;
- second misconception scenario;
- simple concept mastery visualization;
- mobile polish.

### P2 — future work only

- document upload and parsing;
- multiple chapters;
- databases and accounts;
- embeddings and RAG;
- class-level analytics;
- social annotation;
- LMS integration.

---

## 15. Milestones

Use relative milestones so the plan works for different hackathon lengths.

### Phase 1 — first 15%

- freeze the demo chapter and scenario;
- merge schemas and fixture data;
- run mock API from the frontend;
- agree on visual layout.

### Phase 2 — next 35%

- complete tutor flow;
- complete quiz flow;
- complete patch generation and rendering;
- persist state.

### Phase 3 — next 25%

- connect live LLM;
- add fallback handling;
- finish export and reset;
- run the first uninterrupted end-to-end demo;
- record an early backup video.

### Phase 4 — final 25%

- stop adding major features;
- fix only demo-path bugs;
- improve copy and visual clarity;
- rehearse repeatedly;
- record the final backup video;
- verify deployment and local fallback.

---

## 16. Acceptance criteria

The MVP is complete when all of the following pass:

- [ ] A clean browser loads the demo chapter without setup.
- [ ] The user can select a textbook block.
- [ ] The tutor answers the fixed question using the chapter.
- [ ] Tutor references navigate to existing blocks.
- [ ] The user can answer an embedded quiz.
- [ ] A wrong answer updates the correct concept state.
- [ ] A wrong answer generates at least one relevant patch.
- [ ] The patch is shown after the intended block.
- [ ] The original chapter remains unchanged.
- [ ] The personalized view survives refresh.
- [ ] Undo removes the latest patch.
- [ ] Reset Demo restores the default state.
- [ ] Markdown export contains original blocks and active patches.
- [ ] The flow works with the LLM disabled.
- [ ] The complete live demo takes less than three minutes.

---

## 17. Codex implementation instructions

Place the following rules in the root `AGENTS.md`:

1. Implement only the MVP described in `SPEC.md`.
2. Do not add authentication, databases, PDF parsing, embeddings, RAG, or LMS integration.
3. Treat `src/types/contracts.ts` as the source of truth.
4. Validate every AI response before returning it to the UI.
5. Maintain mock, live, and auto modes.
6. Never modify the original chapter object when applying personalization.
7. Keep components small and typed.
8. Include error, loading, and empty states.
9. Run lint, type-check, and relevant tests before marking a task complete.
10. Prefer a working vertical slice over generalized infrastructure.

### Suggested Codex prompt for Coding 1

```text
Read SPEC.md and AGENTS.md. You own the AI/server scope only.
Implement the shared contracts, Zod schemas, learning-state utility,
/api/tutor, /api/personalize, the LLM provider abstraction, and deterministic mock fallback.
Do not edit UI components except when required to expose a typed API contract.
Start by listing the files you will create or modify, then implement one issue at a time.
Run type-check and tests before finishing.
```

### Suggested Codex prompt for Coding 2

```text
Read SPEC.md and AGENTS.md. You own the reader UI and client integration.
Implement the textbook reader, block selection, tutor panel, quiz flow,
localStorage persistence, patch rendering, original/personalized toggle,
undo, reset, and Markdown export.
Use mock API responses first and do not change shared contracts without approval.
Start by listing the files you will create or modify, then implement one vertical slice at a time.
Run type-check and the main smoke flow before finishing.
```

---

## 18. Final demo script

**0:00–0:20 — Problem**  
Traditional textbooks are identical for every student and do not react when a learner is confused.

**0:20–0:40 — Product**  
This chapter starts as a normal textbook, but the system tracks questions and answers to build a personal layer.

**0:40–1:15 — Tutor**  
Ask why triangle area is divided by two. Show the grounded answer and references.

**1:15–1:50 — Error signal**  
Answer the height question incorrectly. Show immediate feedback and the detected misconception.

**1:50–2:25 — Textbook adaptation**  
Show the generated note and follow-up practice question inserted beside the relevant formula.

**2:25–2:45 — Before and after**  
Toggle between Original and My Textbook.

**2:45–3:00 — Closing**  
Export the personalized chapter and restate the product message:
“We are not putting a chatbot beside a textbook. We are making the textbook evolve with the student.”

---

## 19. Final product principle

The MVP should feel like one complete product, not four disconnected technical demonstrations.

When a feature does not directly strengthen the fixed demo story, remove it from the hackathon scope.
