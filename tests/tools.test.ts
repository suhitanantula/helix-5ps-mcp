import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { stripFrontmatter } from "../src/lib/content";
import { apply5ps } from "../src/lib/tools/apply";
import { diagnose5ps } from "../src/lib/tools/diagnose";
import { explain5ps } from "../src/lib/tools/explain";
import {
  compare5psVariants,
  get5psVariant,
  list5psVariants,
} from "../src/lib/tools/variants";
import { PROBLEM_MAX_CHARS } from "../src/lib/limits";

const root = join(process.cwd(), "content");

function body(rel: string): string {
  return stripFrontmatter(readFileSync(join(root, rel), "utf8"));
}

describe("explain_5ps", () => {
  it("returns overview content verbatim", () => {
    const out = explain5ps({});
    assert.equal(out, body("explain/overview.md"));
  });

  it("returns a single P verbatim", () => {
    const out = explain5ps({ p: "perceive" });
    assert.equal(out, body("explain/perceive.md"));
  });

  it("short depth is a prefix of full", () => {
    const full = explain5ps({ p: "perform", depth: "full" });
    const short = explain5ps({ p: "perform", depth: "short" });
    assert.ok(full.startsWith(short.trimEnd()) || full.includes(short.trim().split("\n\n")[0]!));
    assert.ok(short.length < full.length);
  });
});

describe("diagnose_5ps", () => {
  it("routes option-heavy problems toward portfolio", () => {
    const r = diagnose5ps(
      "We keep collapsing to one answer. We need meaningfully different possibilities and trade-offs kept open.",
    );
    assert.equal(r.recommended_p, "portfolio");
    assert.equal(r.content, body("diagnostic.md"));
  });

  it("defaults to perceive when unclear", () => {
    const r = diagnose5ps("xyz");
    assert.equal(r.recommended_p, "perceive");
  });

  it("rejects oversized problem", () => {
    assert.throws(() => diagnose5ps("x".repeat(PROBLEM_MAX_CHARS + 1)));
  });
});

describe("apply_5ps", () => {
  it("returns loop template plus situation", () => {
    const out = apply5ps({ problem: "Improve access to a public service." });
    assert.ok(out.startsWith(body("apply/loop.md").trimEnd()));
    assert.ok(out.includes("Improve access to a public service."));
  });

  it("returns a P template verbatim as the leading block", () => {
    const out = apply5ps({
      problem: "Who is missing from our research?",
      p: "perceive",
    });
    assert.ok(out.startsWith(body("apply/perceive.md").trimEnd()));
  });
});

describe("list_5ps_variants", () => {
  it("returns index content verbatim", () => {
    assert.equal(list5psVariants(), body("variants/index.md"));
  });
});

describe("get_5ps_variant", () => {
  it("returns each variant file verbatim", () => {
    for (const v of ["loop", "multi_agent", "rhizomatic", "population"] as const) {
      assert.equal(get5psVariant(v), body(`variants/${v}.md`));
    }
  });

  it("teasers link to books and site", () => {
    const t = get5psVariant("multi_agent");
    assert.ok(t.includes("https://www.suhitanantula.com/5ps"));
    assert.ok(t.includes("https://www.suhitanantula.com/books/helix-moment"));
    assert.ok(t.includes("Full method via Helix"));
  });
});

describe("compare_5ps_variants", () => {
  it("embeds variant content verbatim", () => {
    const out = compare5psVariants({
      variants: ["loop", "population"],
      situation: "We need volume and selection across diverse trajectories.",
    });
    assert.ok(out.includes(body("variants/loop.md").trimEnd()));
    assert.ok(out.includes(body("variants/population.md").trimEnd()));
    assert.ok(out.includes("We need volume and selection"));
  });

  it("requires 2–4 variants", () => {
    assert.throws(() => compare5psVariants({ variants: ["loop"] }));
  });
});
