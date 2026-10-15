import { normalizeP, readContent, type PKey } from "../content";
import { InvalidArgsError } from "../errors";

export type ExplainArgs = {
  p?: string;
  depth?: string;
};

const DEPTHS = new Set(["short", "full"]);

export function explain5ps(args: ExplainArgs = {}): string {
  let depth: "short" | "full" = "full";
  if (args.depth !== undefined) {
    if (typeof args.depth !== "string") {
      throw new InvalidArgsError("depth must be a string");
    }
    if (!DEPTHS.has(args.depth)) {
      throw new InvalidArgsError('depth must be "short" or "full"');
    }
    depth = args.depth as "short" | "full";
  }

  let p: PKey | undefined;
  if (args.p !== undefined) {
    if (typeof args.p !== "string") {
      throw new InvalidArgsError("p must be a string");
    }
    p = normalizeP(args.p);
    if (!p) {
      throw new InvalidArgsError(
        "p must be one of: perceive, perform, portfolio, pause_promote, progress",
      );
    }
  }

  if (!p) {
    const overview = readContent("explain/overview.md");
    if (depth === "short") {
      return overview.split("\n\n").slice(0, 4).join("\n\n") + "\n";
    }
    return overview;
  }

  const body = readContent(`explain/${p}.md`);
  if (depth === "short") {
    return body.split("\n\n").slice(0, 3).join("\n\n") + "\n";
  }
  return body;
}

export function explainPathFor(p?: PKey): string {
  return p ? `explain/${p}.md` : "explain/overview.md";
}
