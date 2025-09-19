import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const githubToken = process.env.GITHUB_TOKEN;

const GITHUB_API = "https://api.github.com";

function encodeContentPath(path) {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

async function githubRequest(path, { method = "GET", body, headers, allow404 = false } = {}) {
  if (!githubToken) throw new Error("GITHUB_TOKEN missing");

  const requestHeaders = {
    Authorization: `Bearer ${githubToken}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...headers
  };

  let requestBody = body;
  if (body && typeof body === "object") {
    requestBody = JSON.stringify(body);
    requestHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(`${GITHUB_API}${path}`, {
    method,
    headers: requestHeaders,
    body: requestBody
  });

  if (allow404 && response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub API ${response.status} ${response.statusText}: ${errorText}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function codexRun({ params, projectId }) {
  const {
    prompt,
    repo = process.env.REPO_DEFAULT,
    path = `projects/${projectId}/index.js`,
    branch = "main",
    commitMessage
  } = params || {};

  if (!prompt) throw new Error("prompt required");
  if (!repo) throw new Error("repo required (owner/name)");
  if (!githubToken) throw new Error("GITHUB_TOKEN missing");

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }]
  });

  const code = completion.choices?.[0]?.message?.content ?? "";

  const [owner, name] = repo.split("/");
  if (!owner || !name) {
    throw new Error("repo must be in owner/name format");
  }

  const encodedPath = encodeContentPath(path);
  const existing = await githubRequest(
    `/repos/${owner}/${name}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`,
    { allow404: true }
  );

  const message = commitMessage || `codex.run update for ${projectId}`;
  const payload = {
    message,
    content: Buffer.from(code, "utf8").toString("base64"),
    branch
  };

  if (existing?.sha) {
    payload.sha = existing.sha;
  }

  const result = await githubRequest(`/repos/${owner}/${name}/contents/${encodedPath}`, {
    method: "PUT",
    body: payload
  });

  return {
    committed: true,
    path,
    sha: result?.content?.sha ?? null
  };
}
