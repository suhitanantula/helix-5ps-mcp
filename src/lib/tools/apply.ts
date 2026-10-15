import { normalizeP, readContent } from "../content";
import { CONTEXT_MAX_CHARS, PROBLEM_MAX_CHARS } from "../limits";

export type ApplyArgs = {
  problem: string;
  p?: string;
  context?: string;
};

export function apply5ps(args: ApplyArgs): string {
  if (typeof args.problem !== "string" || !args.problem.trim()) {
    throw new Error("problem is required");
  }
  if (args.problem.length > PROBLEM_MAX_CHARS) {
    throw new Error(`problem exceeds ${PROBLEM_MAX_CHARS} characters`);
  }
  if (args.context !== undefined) {
    if (typeof args.context !== "string") {
      throw new Error("context must be a string");
    }
    if (args.context.length > CONTEXT_MAX_CHARS) {
      throw new Error(`context exceeds ${CONTEXT_MAX_CHARS} characters`);
    }
  }

  const p = normalizeP(args.p);
  if (args.p !== undefined && !p) {
    throw new Error(
      "p must be one of: perceive, perform, portfolio, pause_promote, progress",
    );
  }

  const file = p ? `apply/${p}.md` : "apply/loop.md";
  const template = readContent(file);

  const parts = [
    template.trimEnd(),
    "",
    "## Your situation",
    args.problem.trim(),
  ];
  if (args.context?.trim()) {
    parts.push("", "## Context", args.context.trim());
  }
  parts.push("");
  return parts.join("\n");
}
