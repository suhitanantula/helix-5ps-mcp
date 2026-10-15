import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { handleMcpHttp, PROTOCOL_VERSION, SERVER_INFO } from "../src/lib/mcp-http";
import { TOOL_DEFS } from "../src/lib/tools/index";
import { resetRateLimits } from "../src/lib/rate-limit";
import { BODY_MAX_BYTES } from "../src/lib/limits";

async function rpc(method: string, params?: unknown, id: number | string = 1) {
  const res = await handleMcpHttp(
    new Request("http://localhost/mcp", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-vercel-forwarded-for": "203.0.113.10",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
    }),
  );
  const json = await res.json();
  return { res, json };
}

describe("MCP protocol smoke", () => {
  it("GET /mcp returns endpoint info", async () => {
    const res = await handleMcpHttp(
      new Request("http://localhost/mcp", { method: "GET" }),
    );
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.name, SERVER_INFO.name);
    assert.equal(json.auth, "none");
    assert.ok(Array.isArray(json.tools));
    assert.equal(json.tools.length, 6);
  });

  it("initialize without auth", async () => {
    const { res, json } = await rpc("initialize", {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: "test", version: "0" },
    });
    assert.equal(res.status, 200);
    assert.equal(json.result.protocolVersion, PROTOCOL_VERSION);
    assert.equal(json.result.serverInfo.name, "helix-5ps-mcp");
    assert.ok(json.result.capabilities.tools);
  });

  it("tools/list schemas and readOnlyHint", async () => {
    const { json } = await rpc("tools/list");
    const tools = json.result.tools;
    assert.equal(tools.length, 6);
    for (const def of TOOL_DEFS) {
      const t = tools.find((x: { name: string }) => x.name === def.name);
      assert.ok(t, def.name);
      assert.equal(t.title, def.title);
      assert.equal(t.annotations.readOnlyHint, true);
      assert.equal(t.inputSchema.additionalProperties, false);
    }
  });

  it("calls each tool", async () => {
    const calls: Array<{ name: string; arguments: Record<string, unknown> }> = [
      { name: "explain_5ps", arguments: {} },
      { name: "diagnose_5ps", arguments: { problem: "Who is affected and what are we missing?" } },
      { name: "apply_5ps", arguments: { problem: "Plan a small test.", p: "perform" } },
      { name: "list_5ps_variants", arguments: {} },
      { name: "get_5ps_variant", arguments: { variant: "loop" } },
      {
        name: "compare_5ps_variants",
        arguments: { variants: ["loop", "rhizomatic"] },
      },
    ];

    for (const [i, call] of calls.entries()) {
      const { res, json } = await rpc("tools/call", call, i + 10);
      assert.equal(res.status, 200, call.name);
      assert.equal(json.result.isError, undefined);
      assert.equal(json.result.content[0].type, "text");
      assert.ok(json.result.content[0].text.length > 20, call.name);
    }
  });

  it("rejects bad input", async () => {
    const { json } = await rpc("tools/call", {
      name: "get_5ps_variant",
      arguments: { variant: "not_a_form" },
    });
    assert.equal(json.result.isError, true);
  });

  it("rejects oversized body", async () => {
    resetRateLimits();
    const big = "x".repeat(BODY_MAX_BYTES + 10);
    const res = await handleMcpHttp(
      new Request("http://localhost/mcp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-vercel-forwarded-for": "198.51.100.7",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 99,
          method: "tools/call",
          params: {
            name: "diagnose_5ps",
            arguments: { problem: big },
          },
        }),
      }),
    );
    assert.equal(res.status, 413);
  });
});
