# AGENTS.md

## Mission
Build the smallest reliable end-to-end adaptive textbook demo described in `SPEC.md`.

## Hard scope limits
Do not add authentication, databases, PDF parsing, OCR, embeddings, vector databases, RAG, knowledge graphs, Open edX, LTI, xAPI servers, real-time collaboration, or multiple chapters.

## Source of truth
- Product behavior: `SPEC.md`
- Types and API contracts: `src/types/contracts.ts`
- Demo chapter: `src/data/chapter.sample.json`

## Engineering rules
1. Keep the original chapter immutable.
2. Store personalization as `ContentPatch[]`.
3. Validate every AI response with Zod.
4. Support `mock`, `live`, and `auto` modes.
5. Never expose an LLM API key to browser code.
6. Add loading, error, and empty states.
7. Avoid broad refactors during demo-critical work.
8. Run lint, type-check, and relevant tests before finishing.
9. Do not change contracts without a reviewed PR.
10. Prefer working vertical slices over reusable infrastructure.

## Definition of done for each task
- Code compiles and is typed.
- The relevant user flow works manually.
- Failure behavior is handled.
- The PR states test steps.
- No out-of-scope dependency is introduced.
