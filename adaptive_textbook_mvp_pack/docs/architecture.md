# Architecture

The MVP is a single Next.js application.

```text
Browser
├── textbook reader
├── quiz interaction
├── localStorage state
└── personalized patch renderer
        |
        v
Next.js API routes
├── /api/tutor
├── /api/personalize
└── LLM provider + deterministic mock fallback
```

The full chapter is sent to the model because the demo uses only one small chapter. No retrieval infrastructure is used.

The original chapter is immutable. Personalization is represented as patches that target stable block IDs.
