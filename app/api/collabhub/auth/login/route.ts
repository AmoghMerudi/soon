import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import {
  createSessionCookie,
  getConvexServerSecret,
  serializeSessionCookie,
  verifyPassword,
} from "@/lib/collabhub/auth";

type LoginRequest = {
  email?: string;
  password?: string;
};

function getConvex() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  return new ConvexHttpClient(url);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginRequest;
    if (!body.email || !body.password) {
      return Response.json({ error: "email and password are required" }, { status: 400 });
    }

    const user = await getConvex().query(api.collabhub.getUserForAuth, {
      email: body.email,
      serverSecret: getConvexServerSecret(),
    });

    if (!user || !verifyPassword(body.password, user.passwordHash)) {
      return Response.json({ error: "invalid email or password" }, { status: 401 });
    }

    const sessionCookie = createSessionCookie(user);
    return Response.json(
      { userId: user._id },
      { headers: { "Set-Cookie": serializeSessionCookie(sessionCookie) } }
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to log in" },
      { status: 400 }
    );
  }
}
