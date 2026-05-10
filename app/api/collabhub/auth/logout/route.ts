import { serializeExpiredSessionCookie } from "@/lib/collabhub/auth";

export async function POST() {
  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": serializeExpiredSessionCookie() } }
  );
}
