import { ConvexHttpClient } from "convex/browser";
import { OAuth2Client } from "google-auth-library";
import { api } from "@/convex/_generated/api";
import {
  createSessionCookie,
  getConvexServerSecret,
  serializeSessionCookie,
} from "@/lib/collabhub/auth";

type GoogleAuthRequest = {
  credential?: string;
  role?: "brand" | "influencer";
};

function getConvex() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  return new ConvexHttpClient(url);
}

export async function POST(request: Request) {
  try {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return Response.json({ error: "Google OAuth client ID is not configured" }, { status: 500 });
    }

    const body = (await request.json()) as GoogleAuthRequest;
    if (!body.credential || !body.role) {
      return Response.json({ error: "credential and role are required" }, { status: 400 });
    }

    const ticket = await new OAuth2Client(clientId).verifyIdToken({
      idToken: body.credential,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.sub) {
      return Response.json({ error: "Google token did not include email" }, { status: 400 });
    }

    const convex = getConvex();
    const userId = await convex.mutation(api.collabhub.upsertSocialUser, {
      email: payload.email,
      name: payload.name ?? payload.email,
      role: body.role,
      provider: "google",
      providerSub: payload.sub,
      serverSecret: getConvexServerSecret(),
    });
    const user = await convex.query(api.collabhub.getUser, { userId });
    if (!user) throw new Error("social user could not be loaded");

    return Response.json(
      { userId: user._id },
      { headers: { "Set-Cookie": serializeSessionCookie(createSessionCookie(user)) } }
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to continue with Google" },
      { status: 400 }
    );
  }
}
