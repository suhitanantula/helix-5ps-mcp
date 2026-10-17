import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  diagnose5ps,
  type VariantKey,
} from "../src/lib/tools/diagnose";
import type { PKey } from "../src/lib/content";

/**
 * Structural routing cases. Proper nouns swapped for neutral labels so
 * routing cannot depend on them.
 */
const CASES: Array<{
  id: string;
  problem: string;
  variant: VariantKey;
  p: PKey;
}> = [
  {
    id: "C1",
    problem:
      "the product team pricing. The product team has argued for three weeks over three pricing models: (a) free AI profile plus a paid team study, (b) per-seat monthly SaaS, (c) per-study consulting fee. Each model has a champion. Some early users exist; no pricing test has been run.",
    variant: "loop",
    p: "pause_promote",
  },
  {
    id: "C2",
    problem:
      "a partner council Decision Explorer. The Decision Explorer was built with a partner council. Should the studio turn it into a monthly subscription offered to several councils? Councils differ in size, politics and procurement; a partner council's own appetite is unclear; the IP and hosting arrangements are still being worked out.",
    variant: "rhizomatic",
    p: "perceive",
  },
  {
    id: "C3",
    problem:
      "the studio next offer. the studio needs its next offer for the next 6 months. Goals: revenue, using the methodology IP (its frameworks), and staying small (the founder plus a bot fleet). Candidates floating around include workshops, a bot-fleet setup service, a licensed methodology, and a course. Nothing has been chosen.",
    variant: "population",
    p: "portfolio",
  },
  {
    id: "C4",
    problem:
      "a client phase 3 scope. a client (client) has phases 1-2 of the estimating tool done. Phase 3 scope is open: more automation, more product lines, integration with their ERP, or user training. The client sponsor wants a proposal in two weeks; the risk is locking in a scope too early.",
    variant: "multi_agent",
    p: "perceive",
  },
  {
    id: "C5",
    problem:
      'Book launch channel. Launching a chapter of "a book". Options: LinkedIn personal posts, the newsletter, a webinar, or a partner community. One channel gets the main effort for the launch week.',
    variant: "loop",
    p: "pause_promote",
  },
];

describe("diagnose_5ps structural routing (test2)", () => {
  for (const c of CASES) {
    it(`${c.id} → variant ${c.variant}, P ${c.p}`, () => {
      const r = diagnose5ps(c.problem);
      assert.equal(r.recommended_variant, c.variant, `${c.id} variant`);
      assert.equal(r.recommended_p, c.p, `${c.id} starting P`);
      assert.ok(
        typeof r.variant_reason === "string" && r.variant_reason.length > 0,
        `${c.id} variant_reason`,
      );
    });
  }

  it("returns recommended_variant on every diagnose result", () => {
    const r = diagnose5ps("xyz unclear situation with no cues");
    assert.equal(r.recommended_variant, "loop");
    assert.ok(r.variant_reason.length > 0);
    assert.equal(r.recommended_p, "perceive");
  });
});
