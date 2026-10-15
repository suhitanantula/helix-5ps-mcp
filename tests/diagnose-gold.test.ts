import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { diagnose5ps } from "../src/lib/tools/diagnose";
import type { PKey } from "../src/lib/content";

/** Gold cases for which-P routing (approved public wording / cues). */
const GOLD: Array<{ problem: string; p: PKey }> = [
  {
    problem: "What is happening, for whom, and what are we missing?",
    p: "perceive",
  },
  {
    problem: "Who is affected and what assumptions need testing?",
    p: "perceive",
  },
  {
    problem: "We are missing people whose experience we have not heard.",
    p: "perceive",
  },
  {
    problem: "Separate evidence from assumptions before anyone builds.",
    p: "perceive",
  },
  {
    problem: "What signals are you sensing in this situation?",
    p: "perceive",
  },
  {
    problem: "What can we try or make to learn?",
    p: "perform",
  },
  {
    problem: "Help me design a small concrete prototype or test.",
    p: "perform",
  },
  {
    problem: "What concrete action should happen first?",
    p: "perform",
  },
  {
    problem: "We need a pilot MVP sketch to try this week.",
    p: "perform",
  },
  {
    problem: "Label simulations as simulations; plan a real-world test.",
    p: "perform",
  },
  {
    problem: "What different possibilities should we keep open?",
    p: "portfolio",
  },
  {
    problem: "We keep collapsing to one answer; we need meaningfully different approaches and trade-offs.",
    p: "portfolio",
  },
  {
    problem: "Maintain a portfolio of meaningfully different possibilities and trade-offs.",
    p: "portfolio",
  },
  {
    problem: "Climb more than one hill — keep parallel options open.",
    p: "portfolio",
  },
  {
    problem: "How will uncertainty strengthen the option system?",
    p: "portfolio",
  },
  {
    problem: "What deserves to move forward, and why?",
    p: "pause_promote",
  },
  {
    problem: "Help us decide what to promote, hold, or kill.",
    p: "pause_promote",
  },
  {
    problem: "What deserves to move forward? Decide what to promote, hold, or kill against evidence, values and constraints.",
    p: "pause_promote",
  },
  {
    problem: "What criteria decide what matters for this decision?",
    p: "pause_promote",
  },
  {
    problem: "We have too many options — we need to filter and choose what matters.",
    p: "pause_promote",
  },
  {
    problem: "What did we learn?",
    p: "progress",
  },
  {
    problem: "What changed, what did we learn, and what comes next?",
    p: "progress",
  },
  {
    problem: "Compare expectations with observations and record reusable learning.",
    p: "progress",
  },
  {
    problem: "What feedback will the loop capture for the next Perceive cycle?",
    p: "progress",
  },
  {
    problem: "How will learning transfer across the organisation?",
    p: "progress",
  },
  {
    problem: "Leave a short record of decisions and unresolved questions.",
    p: "progress",
  },
  {
    problem: "What comes next after this iteration?",
    p: "progress",
  },
  {
    problem: "xyz unclear situation with no cues",
    p: "perceive",
  },
];

describe("diagnose_5ps gold cases", () => {
  it("routes each gold problem to the expected P", () => {
    assert.ok(GOLD.length >= 20 && GOLD.length <= 40);
    for (const { problem, p } of GOLD) {
      const r = diagnose5ps(problem);
      assert.equal(r.recommended_p, p, problem);
    }
  });

  it("routes 'what did we learn' to Progress", () => {
    assert.equal(
      diagnose5ps("what did we learn").recommended_p,
      "progress",
    );
    assert.equal(
      diagnose5ps("What changed, what did we learn, and what comes next?")
        .recommended_p,
      "progress",
    );
  });

  it("uses If I wording in guidance", () => {
    const r = diagnose5ps("What did we learn from the last loop?");
    assert.match(r.guidance, /^If I already have/);
  });
});
