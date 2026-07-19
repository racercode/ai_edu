# API Contracts

See `SPEC.md` sections 6 and 7. Implement the schemas in `src/types/contracts.ts` and validate endpoint payloads with Zod.

Required endpoints:

- `POST /api/tutor`
- `POST /api/personalize`

Both endpoints must support deterministic mock responses and return errors in a stable JSON shape.
