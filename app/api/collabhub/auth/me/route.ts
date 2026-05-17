import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  COLLABHUB_SESSION_COOKIE,
  getCookieValue,
  parseSessionCookie,
} from "@/lib/collabhub/auth";

function getConvex() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  return new ConvexHttpClient(url);
}

export async function GET(request: Request) {
  try {
    const cookieValue = getCookieValue(request.headers.get("cookie"), COLLABHUB_SESSION_COOKIE);
    const session = parseSessionCookie(cookieValue);
    if (!session) return Response.json({ userId: null });

    const user = await getConvex().query(api.collabhub.getUser, {
      userId: session.userId as Id<"collabUsers">,
    });
    return Response.json({ userId: user?._id ?? null });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load session" },
      { status: 400 }
    );
  }
}
