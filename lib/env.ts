import "server-only";
import { z } from "zod";

const mongoUriSchema = z.string().min(1, "MONGODB_URI is required.");
const llmConfigSchema = z.object({
  apiKey: z.string().min(1, "GROQ_API_KEY is required."),
  model: z.string().min(1).default("llama-3.3-70b-versatile"),
  baseUrl: z.string().url().default("https://api.groq.com/openai/v1"),
});

export function getMongoUri() {
  return mongoUriSchema.parse(process.env.MONGODB_URI);
}

export function getLlmConfig() {
  return llmConfigSchema.parse({
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL,
    baseUrl: process.env.GROQ_API_BASE_URL,
  });
}