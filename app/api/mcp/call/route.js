import { verifyAppJWT } from "@/lib/auth.js";
import { tools } from "@/lib/tools/index.js";

export async function POST(req) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : undefined;
  const ok = await verifyAppJWT(token);
  if (!ok) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

  const { tool, params, userId, projectId } = await req.json();
  const handler = tools[tool];
  if (!handler) return new Response(JSON.stringify({ error: "tool_not_found" }), { status: 404 });

  try {
    const data = await handler({ params, userId, projectId });
    return new Response(JSON.stringify({ status: "ok", data }), {
      headers: { "content-type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ status: "error", message: String(e?.message || e) }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
}
