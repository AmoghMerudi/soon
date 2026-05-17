import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import {
  createSessionCookie,
  getConvexServerSecret,
  hashPassword,
  serializeSessionCookie,
} from "@/lib/collabhub/auth";

type RegisterRequest = {
  email?: string;
  password?: string;
  name?: string;
  role?: "brand" | "influencer";
  companyName?: string;
  niche?: string;
};

function getConvex() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  return new ConvexHttpClient(url);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterRequest;
    if (!body.email || !body.password || !body.name || !body.role) {
      return Response.json({ error: "email, password, name, and role are required" }, { status: 400 });
    }
    if (body.password.length < 8) {
      return Response.json({ error: "password must be at least 8 characters" }, { status: 400 });
    }

    const convex = getConvex();
    const userId = await convex.mutation(api.collabhub.registerPasswordUser, {
      email: body.email,
      passwordHash: hashPassword(body.password),
      name: body.name,
      role: body.role,
      companyName: body.companyName || undefined,
      niche: body.niche || undefined,
      serverSecret: getConvexServerSecret(),
    });

    const user = await convex.query(api.collabhub.getUser, { userId });
    if (!user) throw new Error("created user could not be loaded");

    const sessionCookie = createSessionCookie(user);
    return Response.json(
      { userId: user._id },
      { headers: { "Set-Cookie": serializeSessionCookie(sessionCookie) } }
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to register" },
      { status: 400 }
    );
  }
}
