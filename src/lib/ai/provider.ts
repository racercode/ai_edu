import OpenAI from "openai";
import { z } from "zod";

const mode = () => process.env.NEXT_PUBLIC_DEMO_MODE ?? "auto";
export const isMockMode = () => mode() === "mock";
export async function structuredResponse<T>(schema: z.ZodType<T>, name: string, instructions: string, input: unknown): Promise<T> {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) try {
    const response = await client.responses.create({ model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini", instructions, input: JSON.stringify(input), text: { format: { type: "json_schema", name, strict: true, schema: schemaToJsonSchema(name) } } });
    return schema.parse(JSON.parse(response.output_text));
  } catch (error) { lastError = error; console.error(`${name} validation attempt ${attempt + 1} failed`, error); }
  throw lastError instanceof Error ? lastError : new Error("AI response failed validation");
}

// Zod v3 has no built-in JSON Schema exporter. The API still validates application output with Zod;
// this permissive server schema asks the model for a JSON object before the stricter local check.
function schemaToJsonSchema(name: string) { return { type: "object", title: name, additionalProperties: true }; }
