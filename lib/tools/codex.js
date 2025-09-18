import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function githubRequest(path, { method = "GET", body, headers } = {}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN missing");

  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "codex-runner",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${text}`);
  }

  return res.status === 204 ? null : await res.json();
}

function encodePathSegments(p) {
  return p
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

async function getFileSha(owner, repo, path, branch) {
  try {
    const data = await githubRequest(`/repos/${owner}/${repo}/contents/${encodePathSegments(path)}?ref=${encodeURIComponent(branch)}`);
    return Array.isArray(data) ? undefined : data?.sha;
  } catch (err) {
    if (String(err?.message || err).includes("404")) return undefined;
    throw err;
  }
}

async function createPullRequest(owner, repo, { title, body, base, head }) {
  if (!title || !base || !head) {
    throw new Error("pullRequest requires title, base, and head branches");
  }

  const response = await githubRequest(`/repos/${owner}/${repo}/pulls`, {
    method: "POST",
    body: { title, head, base, body }
  });

  return {
    number: response?.number ?? null,
    url: response?.html_url ?? null,
    state: response?.state ?? null
  };
}

export async function codexRun({ params, projectId }) {
  const {
    prompt,
    repo = process.env.REPO_DEFAULT,
    path = `projects/${projectId}/index.js`,
    branch = "main",
    pullRequest
  } = params || {};
  if (!prompt) throw new Error("prompt required");
  if (!repo) throw new Error("repo required (owner/name)");

  const out = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }]
  });
  const code = out.choices?.[0]?.message?.content ?? "";

  const [owner, name] = repo.split("/");
  const sha = await getFileSha(owner, name, path, branch);

  const body = {
    message: `codex.run update for ${projectId}`,
    content: Buffer.from(code, "utf8").toString("base64"),
    branch
  };
  if (sha) body.sha = sha;

  const result = await githubRequest(`/repos/${owner}/${name}/contents/${encodePathSegments(path)}`, {
    method: "PUT",
    body
  });

  let pr = null;
  if (pullRequest) {
    pr = await createPullRequest(owner, name, {
      head: branch,
      base: pullRequest.base,
      title: pullRequest.title,
      body: pullRequest.body
    });
  }

  return {
    committed: true,
    path,
    sha: result?.content?.sha ?? null,
    pullRequest: pr
  };
}
