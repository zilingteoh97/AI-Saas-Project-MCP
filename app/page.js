export default function Page() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>MCP Server</h1>
      <p>Endpoints available:</p>
      <ul>
        <li><code>/api/health</code></li>
        <li><code>/api/mcp/tools</code></li>
        <li><code>/api/mcp/call</code></li>
        <li><code>/api/mcp/stream</code></li>
      </ul>
    </main>
  );
}
