import { BODY_MAX_BYTES } from "./limits";
import { checkRateLimit } from "./rate-limit";
import { TOOL_DEFS, callTool } from "./tools/index";

export const SERVER_INFO = {
  name: "helix-5ps-mcp",
  title: "Helix 5Ps",
  version: "0.1.0",
} as const;

export const PROTOCOL_VERSION = "2024-11-05";

type JsonRpcId = string | number | null;

interface JsonRpcRequest {
  jsonrpc?: string;
  id?: JsonRpcId;
  method?: string;
  params?: unknown;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function jsonRpcResult(id: JsonRpcId | undefined, result: unknown) {
  return { jsonrpc: "2.0" as const, id: id ?? null, result };
}

function jsonRpcError(
  id: JsonRpcId | undefined,
  code: number,
  message: string,
  data?: unknown,
) {
  return {
    jsonrpc: "2.0" as const,
    id: id ?? null,
    error: data === undefined ? { code, message } : { code, message, data },
  };
}

function clientIp(request: Request): string {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("Origin") ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Accept, Authorization, MCP-Protocol-Version, Mcp-Session-Id",
    "Access-Control-Expose-Headers": "Mcp-Session-Id, Retry-After",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

async function handleSingle(
  message: JsonRpcRequest,
): Promise<{ body: unknown | null; isNotification: boolean }> {
  const method = message.method;
  const id = message.id;
  const isNotification =
    id === undefined || Boolean(method?.startsWith("notifications/"));

  if (!method) {
    return {
      body: jsonRpcError(id, -32600, "Invalid Request: missing method"),
      isNotification: false,
    };
  }

  try {
    switch (method) {
      case "initialize":
        return {
          body: jsonRpcResult(id, {
            protocolVersion: PROTOCOL_VERSION,
            capabilities: { tools: { listChanged: false } },
            serverInfo: SERVER_INFO,
            instructions:
              "Helix 5Ps — read-only tools for the 5Ps of Loop Design. No login. No AI calls inside the server. Advanced forms are teasers; full methods via Helix and suhitanantula.com.",
          }),
          isNotification: false,
        };
      case "notifications/initialized":
      case "notifications/cancelled":
        return { body: null, isNotification: true };
      case "ping":
        return { body: jsonRpcResult(id, {}), isNotification: false };
      case "tools/list":
        return {
          body: jsonRpcResult(id, {
            tools: TOOL_DEFS.map((t) => ({
              name: t.name,
              title: t.title,
              description: t.description,
              inputSchema: t.inputSchema,
              annotations: t.annotations,
            })),
          }),
          isNotification: false,
        };
      case "tools/call": {
        const params = asRecord(message.params);
        const name = asString(params.name);
        if (!name) {
          return {
            body: jsonRpcError(id, -32602, "tools/call requires params.name"),
            isNotification: false,
          };
        }
        const result = await callTool(name, params.arguments ?? {});
        return { body: jsonRpcResult(id, result), isNotification: false };
      }
      default:
        if (isNotification) return { body: null, isNotification: true };
        return {
          body: jsonRpcError(id, -32601, `Method not found: ${method}`),
          isNotification: false,
        };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { body: jsonRpcError(id, -32603, msg), isNotification: false };
  }
}

export async function handleMcpHttp(request: Request): Promise<Response> {
  const baseHeaders = {
    "Content-Type": "application/json",
    ...corsHeaders(request),
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  if (request.method === "GET") {
    return new Response(
      JSON.stringify({
        name: SERVER_INFO.name,
        title: SERVER_INFO.title,
        version: SERVER_INFO.version,
        transport: "streamable-http",
        endpoint: "/mcp",
        auth: "none",
        tools: TOOL_DEFS.map((t) => t.name),
        docs: "https://www.suhitanantula.com/5ps",
        privacy: "/PRIVACY.md",
        message:
          "Stateless Streamable HTTP MCP. POST JSON-RPC (initialize, tools/list, tools/call). No login.",
      }),
      { status: 200, headers: baseHeaders },
    );
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: baseHeaders,
    });
  }

  const ip = clientIp(request);
  const limit = checkRateLimit(ip);
  if (!limit.ok) {
    return new Response(
      JSON.stringify({
        error: "rate_limited",
        message: "Too many requests. Retry later.",
      }),
      {
        status: 429,
        headers: {
          ...baseHeaders,
          "Retry-After": String(limit.retryAfterSec),
        },
      },
    );
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > BODY_MAX_BYTES) {
    return new Response(
      JSON.stringify(
        jsonRpcError(null, -32600, `Request body exceeds ${BODY_MAX_BYTES} bytes`),
      ),
      { status: 413, headers: baseHeaders },
    );
  }

  const raw = await request.arrayBuffer();
  if (raw.byteLength > BODY_MAX_BYTES) {
    return new Response(
      JSON.stringify(
        jsonRpcError(null, -32600, `Request body exceeds ${BODY_MAX_BYTES} bytes`),
      ),
      { status: 413, headers: baseHeaders },
    );
  }

  // Basic request log: method + size + IP hash-ish prefix only (no body).
  console.info(
    JSON.stringify({
      event: "mcp_request",
      method: "POST",
      bytes: raw.byteLength,
      ip_prefix: ip.slice(0, 8),
      ts: new Date().toISOString(),
    }),
  );

  let payload: unknown;
  try {
    payload = JSON.parse(new TextDecoder().decode(raw));
  } catch {
    return new Response(
      JSON.stringify(jsonRpcError(null, -32700, "Parse error")),
      { status: 400, headers: baseHeaders },
    );
  }

  if (Array.isArray(payload)) {
    if (payload.length === 0) {
      return new Response(
        JSON.stringify(
          jsonRpcError(null, -32600, "Invalid Request: empty batch"),
        ),
        { status: 400, headers: baseHeaders },
      );
    }
    const results = [];
    let allNotifications = true;
    for (const item of payload) {
      const handled = await handleSingle(item as JsonRpcRequest);
      if (!handled.isNotification && handled.body !== null) {
        allNotifications = false;
        results.push(handled.body);
      }
    }
    if (allNotifications) {
      return new Response(null, { status: 202, headers: corsHeaders(request) });
    }
    return new Response(JSON.stringify(results), {
      status: 200,
      headers: baseHeaders,
    });
  }

  const handled = await handleSingle(payload as JsonRpcRequest);
  if (handled.isNotification || handled.body === null) {
    return new Response(null, { status: 202, headers: corsHeaders(request) });
  }
  return new Response(JSON.stringify(handled.body), {
    status: 200,
    headers: baseHeaders,
  });
}
