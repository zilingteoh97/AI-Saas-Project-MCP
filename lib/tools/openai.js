import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function chatgptAsk({ params }) {
  const { prompt, model = "gpt-4o-mini" } = params || {};
  if (!prompt) throw new Error("prompt is required");
  const res = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }]
  });
  return res.choices?.[0] ?? null;
}
