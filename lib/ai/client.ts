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
        max_tokens: 4096,
        // gpt-oss models spend output tokens on reasoning; keep it short so the JSON is not cut off.
        ...(/gpt-oss/i.test(config.model) ? { reasoning_effort: "low" } : {}),
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: `${systemPrompt}\nReturn only one JSON object. Do not include markdown.` },
          { role: "user", content: input },
        ],
      }),
      signal: AbortSignal.timeout(35_000),
      cache: "no-store",
    });
  } catch (error) {
    console.error("LLM request could not be sent", { url: config.baseUrl, error: error instanceof Error ? error.message : String(error) });
    throw new AiServiceError("The AI service could not be reached. Check GROQ_API_BASE_URL and your internet connection.");
  }

  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).replace(/\s+/g, " ").slice(0, 300);
    console.error("LLM request failed", { status: response.status, url: config.baseUrl, model: config.model, detail });
    if (response.status === 401 || response.status === 403) {
      throw new AiServiceError("The AI service rejected the API key. Check GROQ_API_KEY.");
    }
    if (response.status === 404) {
      throw new AiServiceError("The AI endpoint or model was not found. Check GROQ_API_BASE_URL (Groq: https://api.groq.com/openai/v1) and GROQ_MODEL.");
    }
    if (response.status === 429) {
      throw new AiServiceError("The AI service is rate limited right now. Wait a minute and try again.");
    }
    throw new AiServiceError(`The AI service returned an error (${response.status}). Please try again.`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    console.error("LLM response was not JSON", { url: config.baseUrl });
    throw new AiServiceError("The AI service returned an unreadable response. Check that GROQ_API_BASE_URL points to the API, not a web page.");
  }

  const content = (payload as { choices?: { message?: { content?: unknown } }[] })
    ?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.length > 50_000) {
    console.error("LLM response had no usable content", { finishReason: (payload as { choices?: { finish_reason?: string }[] })?.choices?.[0]?.finish_reason });
    throw new AiServiceError("The AI service returned an incomplete response.");
  }

  try {
    const jsonText = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    return schema.parse(JSON.parse(jsonText));
  } catch (error) {
    console.error("LLM JSON did not match schema", error instanceof Error ? error.message.slice(0, 600) : String(error));
    throw new AiServiceError("The AI response did not match the expected format. Please try again.");
  }
}