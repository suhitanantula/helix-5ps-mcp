import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { callTool } from "../src/lib/tools/index";
import { PROBLEM_MAX_CHARS } from "../src/lib/limits";

async function errPayload(name: string, args: unknown) {
  const r = await callTool(name, args);
  assert.equal(r.isError, true);
  return JSON.parse(r.content[0]!.text) as {
    error: string;
    message: string;
  };
}

describe("input validation", () => {
  it("rejects unknown keys", async () => {
    const e = await errPayload("explain_5ps", { extra: true });
    assert.equal(e.error, "invalid_args");
    assert.match(e.message, /unknown property/);
  });

  it("rejects unknown p and depth", async () => {
    const p = await errPayload("explain_5ps", { p: "not_a_p" });
    assert.equal(p.error, "invalid_args");
    assert.match(p.message, /p must be one of/);

    const d = await errPayload("explain_5ps", { depth: "medium" });
    assert.equal(d.error, "invalid_args");
    assert.match(d.message, /depth must be/);
  });

  it("says must be a string for wrong types", async () => {
    const e = await errPayload("diagnose_5ps", { problem: 123 });
    assert.equal(e.error, "invalid_args");
    assert.equal(e.message, "problem must be a string");

    const e2 = await errPayload("explain_5ps", { p: 1 });
    assert.equal(e2.error, "invalid_args");
    assert.equal(e2.message, "p must be a string");
  });

  it("uses invalid_args for cap errors", async () => {
    const e = await errPayload("diagnose_5ps", {
      problem: "x".repeat(PROBLEM_MAX_CHARS + 1),
    });
    assert.equal(e.error, "invalid_args");
    assert.match(e.message, /exceeds/);
  });
});
