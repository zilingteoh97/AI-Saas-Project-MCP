import { listTools } from "@/lib/tools/index.js";

export async function GET() {
  return new Response(
    JSON.stringify({
      version: "1.0",
      tools: listTools(),
      capabilities: { streaming: true }
    }),
    { headers: { "content-type": "application/json" } }
  );
}
