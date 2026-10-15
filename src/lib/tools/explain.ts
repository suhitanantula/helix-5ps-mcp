import { normalizeP, readContent, type PKey } from "../content";

export type ExplainArgs = {
  p?: string;
  depth?: "short" | "full";
};

export function explain5ps(args: ExplainArgs = {}): string {
  const depth = args.depth === "short" ? "short" : "full";
  const p = normalizeP(args.p);

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
