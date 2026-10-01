import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponseSchema } from "@/lib/validation/schemas";

export function jsonResponse<T>(schema: z.ZodType<T>, payload: unknown, status = 200) {
  return NextResponse.json(schema.parse(payload), { status });
}

export function jsonError(message: string, status: number) {
  return NextResponse.json(apiErrorResponseSchema.parse({ error: message }), { status });
}