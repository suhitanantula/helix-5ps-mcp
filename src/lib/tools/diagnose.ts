import { P_KEYS, readContent, type PKey } from "../content";
import { InvalidArgsError } from "../errors";
import { PROBLEM_MAX_CHARS } from "../limits";

const CUES: Record<PKey, RegExp[]> = {
  perceive: [
    /\b(understand|missing|people|affected|assumptions?|evidence|signals?|sensing|empathy|context|for whom|what is happening)\b/i,
    /\b(research|interview|stakeholder|user need|weak pattern)\b/i,
  ],
  perform: [
    /\b(try|make|prototype|test|experiment|execute|action|move|draft|simulate|build|implement)\b/i,
    /\b(concrete|pilot|mvp|sketch|conversation)\b/i,
  ],
  portfolio: [
    /\b(options?|possibilities|portfolio|alternatives?|trade-?offs?|diverse|parallel|anti-?fragil|hills?|variations?)\b/i,
    /\b(keep open|different approaches|one answer)\b/i,
  ],
  pause_promote: [
    /\b(decide|decision|choose|choice|promote|pause|kill|filter|judgement|judgment|deserve|criteria|compare)\b/i,
    /\b(advance|hold|combine|stop|what matters)\b/i,
  ],
  progress: [
    /\b(learn(ed|ing)?|changed|next|feedback|progress|record|reusable|memory|iterate|iteration|what comes next|what did we learn)\b/i,
    /\b(expectations?|observations?|transfer)\b/i,
  ],
};

/** Strong phrase → P boosts (approved five-question wording). */
const PHRASE_BOOSTS: Array<{ re: RegExp; p: PKey; weight: number }> = [
  { re: /what did we learn/i, p: "progress", weight: 10 },
  { re: /what changed/i, p: "progress", weight: 8 },
  { re: /what comes next/i, p: "progress", weight: 8 },
  {
    re: /what is happening,? for whom,? and what are we missing/i,
    p: "perceive",
    weight: 10,
  },
  { re: /what are we missing/i, p: "perceive", weight: 8 },
  { re: /what can we try or make to learn/i, p: "perform", weight: 10 },
  {
    re: /what different possibilities should we keep open/i,
    p: "portfolio",
    weight: 10,
  },
  {
    re: /what deserves to move forward/i,
    p: "pause_promote",
    weight: 10,
  },
  {
    re: /promote,\s*hold,\s*(combine\s*or\s*stop|or\s*kill)/i,
    p: "pause_promote",
    weight: 8,
  },
];

function score(text: string, patterns: RegExp[]): number {
  let n = 0;
  for (const re of patterns) {
    if (re.test(text)) n += 1;
  }
  return n;
}

export type DiagnoseResult = {
  recommended_p: PKey;
  scores: Record<PKey, number>;
  reasons: string[];
  guidance: string;
  content: string;
};

export function diagnose5ps(problem: string): DiagnoseResult {
  if (typeof problem !== "string") {
    throw new InvalidArgsError("problem must be a string");
  }
  if (!problem.trim()) {
    throw new InvalidArgsError("problem is required");
  }
  if (problem.length > PROBLEM_MAX_CHARS) {
    throw new InvalidArgsError(
      `problem exceeds ${PROBLEM_MAX_CHARS} characters`,
    );
  }

  const scores = {
    perceive: score(problem, CUES.perceive),
    perform: score(problem, CUES.perform),
    portfolio: score(problem, CUES.portfolio),
    pause_promote: score(problem, CUES.pause_promote),
    progress: score(problem, CUES.progress),
  } as Record<PKey, number>;

  for (const boost of PHRASE_BOOSTS) {
    if (boost.re.test(problem)) {
      scores[boost.p] += boost.weight;
    }
  }

  let recommended: PKey = "perceive";
  let best = -1;
  // Stable order; on ties keep the first max (boosts already applied).
  for (const key of P_KEYS) {
    if (scores[key] > best) {
      best = scores[key];
      recommended = key;
    }
  }

  // Default from approved guidance when ambiguous.
  if (best <= 0) {
    recommended = "perceive";
  }

  const content = readContent("diagnostic.md");
  const explain = readContent(`explain/${recommended}.md`);
  const firstQuestion =
    explain
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.startsWith("What ") || l.startsWith("What\u00a0")) ??
    recommended;

  const reasons: string[] = [];
  if (best <= 0) {
    reasons.push(
      "Normally start with Perceive and Portfolio: understand the situation and open up possibilities before settling on a plan.",
    );
  } else {
    reasons.push(`Matched cues for ${recommended}.`);
    reasons.push(firstQuestion);
  }

  return {
    recommended_p: recommended,
    scores,
    reasons,
    guidance:
      "If I already have evidence and options, start where they lead. Return to an earlier question whenever new evidence warrants it.",
    content,
  };
}
