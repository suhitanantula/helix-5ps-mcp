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

export type VariantKey = "loop" | "multi_agent" | "rhizomatic" | "population";

function score(text: string, patterns: RegExp[]): number {
  let n = 0;
  for (const re of patterns) {
    if (re.test(text)) n += 1;
  }
  return n;
}

/** Letter-labeled options such as (a)…(b)…(c). */
function hasLetterOptions(text: string): boolean {
  return (
    /\([aA]\)[\s\S]*\([bB]\)[\s\S]*\([cC]\)/.test(text) ||
    /\b[aA]\)[\s\S]*\b[bB]\)[\s\S]*\b[cC]\)/.test(text)
  );
}

/** Explicit Options: / Candidates: list with several named paths. */
function hasNamedOptionList(text: string): boolean {
  if (hasLetterOptions(text)) return true;
  if (
    /\boptions?\s*:\s*.+\b(or|,)\b.+/i.test(text) &&
    /\b(one\s+\w+\s+gets|main\s+effort|launch\s+week|pick|choose|decision)\b/i.test(
      text,
    )
  ) {
    return true;
  }
  return false;
}

function hasOngoingArgument(text: string): boolean {
  return /\b(argued|arguing|argument|champions?)\b/i.test(text);
}

function hasDeadlineToPickOne(text: string): boolean {
  return (
    /\b(one\s+\w+\s+gets\s+the\s+main\s+effort|launch\s+week|proposal\s+in\s+\w+\s+weeks?)\b/i.test(
      text,
    ) ||
    (/\b(deadline|in\s+two\s+weeks|this\s+week)\b/i.test(text) &&
      hasNamedOptionList(text))
  );
}

function hasMultipleGoals(text: string): boolean {
  const goalsBlock = text.match(/\bgoals?\s*:\s*([^.]+)/i);
  if (!goalsBlock) return false;
  const body = goalsBlock[1] ?? "";
  const parts = body.split(/,| and |;/i).map((s) => s.trim()).filter(Boolean);
  return parts.length >= 2;
}

function hasLooseCandidateList(text: string): boolean {
  return (
    /\b(candidates?\s+floating|floating\s+around|nothing\s+has\s+been\s+chosen|nothing\s+chosen)\b/i.test(
      text,
    ) ||
    (/\bcandidates?\b/i.test(text) &&
      /\b(include|including)\b/i.test(text) &&
      /\bnothing\s+(has\s+been\s+)?chosen\b/i.test(text))
  );
}

function hasUnclearPartnerAppetite(text: string): boolean {
  return (
    /\bappetite\s+is\s+unclear\b/i.test(text) ||
    /\bown\s+appetite\s+is\s+unclear\b/i.test(text) ||
    /\bunclear[^.]*\bappetite\b/i.test(text)
  );
}

function hasIpOrHostingUnsettled(text: string): boolean {
  return (
    /\b(IP|intellectual\s+property)\b/i.test(text) &&
    /\bhosting\b/i.test(text) &&
    /\b(still\s+being\s+worked\s+out|unsettled|unclear|open)\b/i.test(text)
  );
}

function hasSeveralStakeholderCentres(text: string): boolean {
  return (
    /\b(differ\s+in\s+size|several\s+(councils|partners|stakeholders|centres|centers))\b/i.test(
      text,
    ) && /\b(politics|procurement|stakeholder)\b/i.test(text)
  );
}

function hasOpenClientScopeWithLockIn(text: string): boolean {
  const openScope = /\bscope\s+is\s+open\b/i.test(text);
  const lockIn =
    /\b(locking\s+in|lock[- ]?in|too\s+early)\b/i.test(text) &&
    /\b(risk|scope)\b/i.test(text);
  const deadline =
    /\b(proposal\s+in\s+\w+\s+weeks?|in\s+two\s+weeks|deadline)\b/i.test(text);
  return openScope && lockIn && deadline;
}

function hasOneOptionAlreadyCommitted(text: string): boolean {
  return /\b(already\s+committed|already\s+chosen|locked\s+in\s+on)\b/i.test(
    text,
  );
}

/**
 * Pick a recommended variant. First matching rule wins.
 * Rules use structural cues only — no proper nouns.
 */
export function recommendVariant(problem: string): {
  variant: VariantKey;
  reason: string;
} {
  // 1. Fixed named options, one decision, one owner → loop
  //    (arguing champions still count as loop, not multi_agent)
  if (
    hasNamedOptionList(problem) &&
    (hasOngoingArgument(problem) ||
      hasDeadlineToPickOne(problem) ||
      /\b(each\s+\w+\s+has\s+a\s+champion|one\s+\w+\s+gets)\b/i.test(problem))
  ) {
    return {
      variant: "loop",
      reason:
        "A fixed set of named options with one decision and one owner fits the standard loop.",
    };
  }

  // 2. Two+ explicit goals plus a loose candidate list → population
  if (hasMultipleGoals(problem) && hasLooseCandidateList(problem)) {
    return {
      variant: "population",
      reason:
        "Several goals to trade off and a loose candidate list with nothing chosen fit a population approach.",
    };
  }

  // 3. Unclear partner appetite, unsettled IP/hosting, or several centres → rhizomatic
  if (
    hasUnclearPartnerAppetite(problem) ||
    hasIpOrHostingUnsettled(problem) ||
    hasSeveralStakeholderCentres(problem)
  ) {
    return {
      variant: "rhizomatic",
      reason:
        "An external partner with unclear appetite or unsettled IP and hosting points to a rhizomatic form.",
    };
  }

  // 4. Open client scope + deadline + lock-in / too-early risk → multi_agent
  if (hasOpenClientScopeWithLockIn(problem)) {
    return {
      variant: "multi_agent",
      reason:
        "An open client scope with a deadline and lock-in risk fits a multi-agent form.",
    };
  }

  // 5. Default loop (do not pick multi_agent only because something "could settle too early")
  return {
    variant: "loop",
    reason: "No stronger structural cue matched; default to the standard loop.",
  };
}

/**
 * Structural starting-P overrides. Return null to fall back to cue scoring.
 */
export function recommendStartingPOverride(problem: string): PKey | null {
  // Unclear partner/client appetite, or open client scope with lock-in risk → perceive
  if (
    hasUnclearPartnerAppetite(problem) ||
    hasOpenClientScopeWithLockIn(problem)
  ) {
    return "perceive";
  }

  // Fixed set with ongoing argument, or a deadline to pick one → pause_promote
  // (missing evidence / no test run is the next test, not a reason for Perceive)
  if (
    (hasNamedOptionList(problem) && hasOngoingArgument(problem)) ||
    (hasNamedOptionList(problem) && hasDeadlineToPickOne(problem))
  ) {
    return "pause_promote";
  }

  // Loose floating candidate list, nothing chosen, nobody stuck → portfolio
  if (hasLooseCandidateList(problem) && hasMultipleGoals(problem)) {
    return "portfolio";
  }

  // Portfolio-from-"one outcome" only when one option is already committed
  if (
    hasOneOptionAlreadyCommitted(problem) &&
    /\b(bet|betting|one\s+outcome|one\s+answer)\b/i.test(problem)
  ) {
    return "portfolio";
  }

  return null;
}

export type DiagnoseResult = {
  recommended_p: PKey;
  recommended_variant: VariantKey;
  variant_reason: string;
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

  const pOverride = recommendStartingPOverride(problem);
  if (pOverride) {
    recommended = pOverride;
  }

  const { variant, reason: variantReason } = recommendVariant(problem);

  const content = readContent("diagnostic.md");
  const explain = readContent(`explain/${recommended}.md`);
  const firstQuestion =
    explain
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.startsWith("What ") || l.startsWith("What\u00a0")) ??
    recommended;

  const reasons: string[] = [];
  if (pOverride) {
    reasons.push(`Structural cue for ${recommended}.`);
    reasons.push(firstQuestion);
  } else if (best <= 0) {
    reasons.push(
      "Normally start with Perceive and Portfolio: understand the situation and open up possibilities before settling on a plan.",
    );
  } else {
    reasons.push(`Matched cues for ${recommended}.`);
    reasons.push(firstQuestion);
  }

  return {
    recommended_p: recommended,
    recommended_variant: variant,
    variant_reason: variantReason,
    scores,
    reasons,
    guidance:
      "If I already have evidence and options, start where they lead. Return to an earlier question whenever new evidence warrants it.",
    content,
  };
}
