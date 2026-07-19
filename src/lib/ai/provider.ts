import OpenAI from "openai";
import { z } from "zod";

const mode = () => process.env.NEXT_PUBLIC_DEMO_MODE ?? "auto";
export const isMockMode = () => mode() === "mock";
export async function structuredResponse<T>(schema: z.ZodType<T>, name: string, instructions: string, input: unknown): Promise<T> {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) try {
    const response = await client.responses.create({ model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini", instructions, input: JSON.stringify(input), text: { format: { type: "json_schema", name, strict: false, schema: schemaToJsonSchema(name) } } });
    return schema.parse(JSON.parse(response.output_text));
  } catch (error) { lastError = error; console.error(`${name} validation attempt ${attempt + 1} failed`, error); }
  throw lastError instanceof Error ? lastError : new Error("AI response failed validation");
}

// The Responses API is asked for a JSON object; each result is then strictly parsed by the
// supplied Zod schema and retried once. This keeps the runtime contract authoritative without
// introducing a browser-visible API key or a schema-generation dependency.
function schemaToJsonSchema(name: string) { return { type: "object", title: name, additionalProperties: true }; }
