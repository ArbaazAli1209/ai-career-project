import { ZodError } from "zod";
import { hashPassword } from "@/lib/auth/password";
import { connectToDatabase } from "@/lib/db/connect";
import { UserModel } from "@/lib/db/models/User";
import { accountResponseSchema, registrationSchema } from "@/lib/validation/schemas";
import { jsonError, jsonResponse } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = registrationSchema.parse(await request.json());
    await connectToDatabase();
    if (await UserModel.exists({ email: input.email })) {
      return jsonError("An account with this email already exists.", 409);
    }
    const user = await UserModel.create({
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
    });
    return jsonResponse(accountResponseSchema, { user: { id: user.id, name: user.name, email: user.email } }, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError("Check the name, email, and password fields.", 400);
    }
    if (error instanceof SyntaxError) return jsonError("Invalid JSON body.", 400);
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      return jsonError("An account with this email already exists.", 409);
    }
    console.error("Registration failed", error);
    return jsonError("We could not create your account right now.", 500);
  }
}