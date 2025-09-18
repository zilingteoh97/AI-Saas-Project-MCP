export async function GET() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode("event: ping\n"));
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ ts: Date.now() })}\n\n`));
      controller.close();
    }
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
}
