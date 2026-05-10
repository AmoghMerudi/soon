import { ConvexHttpClient } from "convex/browser";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { api } from "@/convex/_generated/api";
import {
  createSessionCookie,
  getConvexServerSecret,
  serializeSessionCookie,
} from "@/lib/collabhub/auth";

type AppleAuthRequest = {
  identityToken?: string;
  role?: "brand" | "influencer";
};

const appleJwks = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

function getConvex() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  return new ConvexHttpClient(url);
}

export async function POST(request: Request) {
  try {
    const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID ?? process.env.APPLE_CLIENT_ID;
    if (!clientId) {
      return Response.json({ error: "Apple client ID is not configured" }, { status: 500 });
    }

    const body = (await request.json()) as AppleAuthRequest;
    if (!body.identityToken || !body.role) {
      return Response.json({ error: "identityToken and role are required" }, { status: 400 });
    }

    const { payload } = await jwtVerify(body.identityToken, appleJwks, {
      issuer: "https://appleid.apple.com",
      audience: clientId,
    });

    if (!payload.email || !payload.sub) {
      return Response.json({ error: "Apple token did not include email" }, { status: 400 });
    }

    const email = String(payload.email);
    const convex = getConvex();
    const userId = await convex.mutation(api.collabhub.upsertSocialUser, {
      email,
      name: email,
      role: body.role,
      provider: "apple",
      providerSub: String(payload.sub),
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
      { error: error instanceof Error ? error.message : "Unable to continue with Apple" },
      { status: 400 }
    );
  }
}
