import "server-only";
import { getLlmConfig } from "@/lib/env";
import type { z } from "zod";

export class AiServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiServiceError";
  }
}

export async function generateStructured<T>(
  systemPrompt: string,
  input: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const config = getLlmConfig();
  let response: Response;
  try {
    response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.25,
        max_tokens: 3500,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: `${systemPrompt}\nReturn only one JSON object. Do not include markdown.` },
          { role: "user", content: input },
        ],
      }),
      signal: AbortSignal.timeout(35_000),
      cache: "no-store",
    });
  } catch {
    throw new AiServiceError("The AI service could not be reached. Please try again shortly.");
  }

  if (!response.ok) {
    console.error("LLM request failed with status", response.status);
    throw new AiServiceError("The AI service could not complete this analysis. Please try again.");
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new AiServiceError("The AI service returned an unreadable response.");
  }

  const content = (payload as { choices?: { message?: { content?: unknown } }[] })
    ?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.length > 50_000) {
    throw new AiServiceError("The AI service returned an incomplete response.");
  }

  try {
    const jsonText = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    return schema.parse(JSON.parse(jsonText));
  } catch {
    throw new AiServiceError("The AI response did not match the expected format. Please try again.");
  }
}