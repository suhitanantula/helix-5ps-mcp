import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clientIp } from "../src/lib/mcp-http";

describe("clientIp", () => {
  it("prefers x-vercel-forwarded-for over X-Forwarded-For", () => {
    const req = new Request("http://localhost/mcp", {
      headers: {
        "x-forwarded-for": "1.1.1.1, 2.2.2.2",
        "x-vercel-forwarded-for": "9.9.9.9",
      },
    });
    assert.equal(clientIp(req), "9.9.9.9");
  });

  it("falls back to x-real-ip, not first XFF", () => {
    const req = new Request("http://localhost/mcp", {
      headers: {
        "x-forwarded-for": "8.8.8.8",
        "x-real-ip": "7.7.7.7",
      },
    });
    assert.equal(clientIp(req), "7.7.7.7");
  });

  it("does not trust X-Forwarded-For alone", () => {
    const req = new Request("http://localhost/mcp", {
      headers: { "x-forwarded-for": "8.8.8.8" },
    });
    assert.equal(clientIp(req), "unknown");
  });
});
