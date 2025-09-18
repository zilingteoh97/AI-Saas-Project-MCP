import OpenAI from "openai";
import { Octokit } from "@octokit/rest";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const github = process.env.GITHUB_TOKEN ? new Octokit({ auth: process.env.GITHUB_TOKEN }) : null;

export async function codexRun({ params, projectId }) {
  const {
    prompt,
    repo = process.env.REPO_DEFAULT,
    path = `projects/${projectId}/index.js`,
    branch = "main"
  } = params || {};
  if (!prompt) throw new Error("prompt required");
  if (!repo) throw new Error("repo required (owner/name)");
  if (!github) throw new Error("GITHUB_TOKEN missing");

  const out = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }]
  });
  const code = out.choices?.[0]?.message?.content ?? "";

  const [owner, name] = repo.split("/");
  let sha;
  try {
    const found = await github.repos.getContent({ owner, repo: name, path, ref: branch });
    if (!Array.isArray(found.data)) sha = found.data.sha;
  } catch {}

  const res = await github.repos.createOrUpdateFileContents({
    owner,
    repo: name,
    path,
    message: `codex.run update for ${projectId}`,
    content: Buffer.from(code, "utf8").toString("base64"),
    branch,
    sha
  });

  return { committed: true, path, sha: res.data.content?.sha ?? null };
}
