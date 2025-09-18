import { verifyAppJWT } from "@/lib/auth.js";
import { tools } from "@/lib/tools/index.js";

export async function POST(req) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : undefined;
  const ok = await verifyAppJWT(token);
  if (!ok) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" }
    });
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  const { tool, params, userId, projectId } = payload || {};
  if (!projectId || typeof projectId !== "string") {
    return new Response(JSON.stringify({ error: "projectId_required" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  const handler = tools[tool];
  if (!handler) {
    return new Response(JSON.stringify({ error: "tool_not_found", tool }), {
      status: 404,
      headers: { "content-type": "application/json" }
    });
  }

  try {
    const data = await handler({ params, userId, projectId });
    return new Response(JSON.stringify({ status: "ok", data }), {
      headers: { "content-type": "application/json" }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: "error",
        message: String(error?.message || error),
        tool,
        projectId
      }),
      {
        status: 500,
        headers: { "content-type": "application/json" }
      }
    );
  }
}
