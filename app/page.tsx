export default function HomePage() {
  return (
    <main
      style={{
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        maxWidth: 720,
        margin: "3rem auto",
        padding: "0 1.25rem",
        lineHeight: 1.55,
        color: "#1a1a1a",
      }}
    >
      <h1 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>
        Helix 5Ps MCP
      </h1>
      <p>
        Open, no-login Model Context Protocol server for the{" "}
        <strong>5Ps of Loop Design</strong>: Perceive → Perform → Portfolio →
        Pause/Promote → Progress.
      </p>
      <p>
        Streamable HTTP endpoint: <code>/mcp</code> (POST JSON-RPC). No
        accounts. No AI calls inside the server.
      </p>
      <ul>
        <li>
          <a href="https://www.suhitanantula.com/5ps">5Ps on suhitanantula.com</a>
        </li>
        <li>
          <a href="https://www.suhitanantula.com/books/helix-moment">
            The Helix Moment
          </a>
        </li>
        <li>
          <a href="https://www.suhitanantula.com/books/co-intelligent">
            The Co-Intelligent Organisation
          </a>
        </li>
      </ul>
      <p style={{ color: "#555", fontSize: "0.95rem" }}>
        Support email: TODO · Logo: TODO
      </p>
    </main>
  );
}
