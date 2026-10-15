import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { handleMcpHttp } from "../src/lib/mcp-http";
import {
  DEFAULT_PROTOCOL_VERSION,
  negotiateProtocolVersion,
} from "../src/lib/protocol";

describe("negotiateProtocolVersion", () => {
  it("echoes 2025-06-18", () => {
    assert.equal(negotiateProtocolVersion("2025-06-18"), "2025-06-18");
  });
  it("echoes 2025-03-26", () => {
    assert.equal(negotiateProtocolVersion("2025-03-26"), "2025-03-26");
  });
  it("echoes 2024-11-05", () => {
    assert.equal(negotiateProtocolVersion("2024-11-05"), "2024-11-05");
  });
  it("defaults unknown versions to 2025-06-18", () => {
    assert.equal(negotiateProtocolVersion("2099-01-01"), "2025-06-18");
    assert.equal(negotiateProtocolVersion(undefined), "2025-06-18");
    assert.equal(negotiateProtocolVersion(42), "2025-06-18");
    assert.equal(DEFAULT_PROTOCOL_VERSION, "2025-06-18");
  });
});

describe("initialize protocol echo", () => {
  async function init(protocolVersion: string | undefined) {
    const params: Record<string, unknown> = {
      capabilities: {},
      clientInfo: { name: "bench", version: "0" },
    };
    if (protocolVersion !== undefined) {
      params.protocolVersion = protocolVersion;
    }
    const res = await handleMcpHttp(
      new Request("http://localhost/mcp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-vercel-forwarded-for": "203.0.113.50",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params,
        }),
      }),
    );
    return res.json();
  }

  it("echoes each supported client version over HTTP", async () => {
    for (const v of ["2025-06-18", "2025-03-26", "2024-11-05"] as const) {
      const json = await init(v);
      assert.equal(json.result.protocolVersion, v, v);
    }
  });

  it("returns 2025-06-18 for unknown client version", async () => {
    const json = await init("not-a-real-version");
    assert.equal(json.result.protocolVersion, "2025-06-18");
  });
});
