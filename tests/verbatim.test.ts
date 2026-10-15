import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { stripFrontmatter } from "../src/lib/content";
import { explain5ps } from "../src/lib/tools/explain";
import {
  get5psVariant,
  list5psVariants,
} from "../src/lib/tools/variants";
import { diagnose5ps } from "../src/lib/tools/diagnose";
import { apply5ps } from "../src/lib/tools/apply";

const contentRoot = join(process.cwd(), "content");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (name.endsWith(".md")) out.push(full);
  }
  return out;
}

describe("verbatim content gate", () => {
  it("every tool-facing markdown file is non-empty and has a source URL in frontmatter (except LICENSE)", () => {
    const files = walk(contentRoot).filter((f) => !f.endsWith("LICENSE"));
    assert.ok(files.length >= 10);
    for (const file of files) {
      const raw = readFileSync(file, "utf8");
      assert.ok(raw.startsWith("---\n"), file);
      assert.ok(/\nsource: https?:\/\//.test(raw), `source missing: ${file}`);
      const body = stripFrontmatter(raw).trim();
      assert.ok(body.length > 40, file);
    }
  });

  it("explain / list / get / diagnose content fields match files byte-for-byte (body)", () => {
    assert.equal(
      explain5ps({}),
      stripFrontmatter(readFileSync(join(contentRoot, "explain/overview.md"), "utf8")),
    );
    assert.equal(
      explain5ps({ p: "progress" }),
      stripFrontmatter(readFileSync(join(contentRoot, "explain/progress.md"), "utf8")),
    );
    assert.equal(
      list5psVariants(),
      stripFrontmatter(readFileSync(join(contentRoot, "variants/index.md"), "utf8")),
    );
    assert.equal(
      get5psVariant("rhizomatic"),
      stripFrontmatter(readFileSync(join(contentRoot, "variants/rhizomatic.md"), "utf8")),
    );
    const d = diagnose5ps("What changed and what did we learn?");
    assert.equal(
      d.content,
      stripFrontmatter(readFileSync(join(contentRoot, "diagnostic.md"), "utf8")),
    );
  });

  it("apply embeds apply/*.md verbatim as the leading section", () => {
    const fileBody = stripFrontmatter(
      readFileSync(join(contentRoot, "apply/portfolio.md"), "utf8"),
    ).trimEnd();
    const out = apply5ps({
      problem: "Keep three meaningfully different approaches open.",
      p: "portfolio",
    });
    assert.ok(out.startsWith(fileBody));
  });

  it("listing text does not mention pstack", () => {
    const corpus = [
      explain5ps({}),
      list5psVariants(),
      get5psVariant("loop"),
      get5psVariant("multi_agent"),
      readFileSync(join(process.cwd(), "README.md"), "utf8"),
      readFileSync(join(process.cwd(), ".cursor-plugin/plugin.json"), "utf8"),
    ].join("\n");
    assert.ok(!/\bpstack\b/i.test(corpus.replace(/not pstack/gi, "")));
    // README may say "not pstack" — ensure we don't market pstack as included.
    assert.ok(!/includes pstack/i.test(corpus));
  });
});
