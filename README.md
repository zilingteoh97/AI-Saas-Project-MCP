# MCP Server (Multi-Project)

This is a minimal MCP-style server built with Next.js App Router (JavaScript). 
It avoids scoped npm packages for proxy-friendly installs.

## Endpoints
- `GET  /api/health` → health probe
- `GET  /api/mcp/tools` → list available tools
- `POST /api/mcp/call` → invoke a tool
- `GET  /api/mcp/stream` → SSE demo

## Tools
- **chatgpt.ask** → calls OpenAI API
- **supabase.query** → queries Supabase REST scoped by projectId
- **codex.run** → optional code generation + GitHub commit

## Deploy
Push this repo to GitHub, then import it in Vercel.  
Set environment variables:
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `JWT_SECRET`
- `GITHUB_TOKEN` (optional, for codex.run)
- `REPO_DEFAULT` (optional fallback repo)
