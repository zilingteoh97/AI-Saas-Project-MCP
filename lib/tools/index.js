import { chatgptAsk } from "./openai.js";
import { supabaseQuery } from "./supabase.js";
import { codexRun } from "./codex.js";

export const tools = {
  "chatgpt.ask": chatgptAsk,
  "supabase.query": supabaseQuery,
  "codex.run": codexRun
};

export function listTools() {
  return Object.keys(tools).map((name) => ({
    name,
    params: { type: "object", additionalProperties: true }
  }));
}
