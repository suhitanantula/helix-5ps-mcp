import {
  normalizeVariant,
  readContent,
  VARIANT_KEYS,
  type VariantKey,
} from "../content";
import { InvalidArgsError } from "../errors";
import { SITUATION_MAX_CHARS } from "../limits";

export function list5psVariants(): string {
  return readContent("variants/index.md");
}

export function get5psVariant(variant: string): string {
  if (typeof variant !== "string") {
    throw new InvalidArgsError("variant must be a string");
  }
  const key = normalizeVariant(variant);
  if (!key) {
    throw new InvalidArgsError(
      `variant must be one of: ${VARIANT_KEYS.join("|")}`,
    );
  }
  return readContent(`variants/${key}.md`);
}

export type CompareArgs = {
  variants: string[];
  situation?: string;
};

export function compare5psVariants(args: CompareArgs): string {
  if (!Array.isArray(args.variants)) {
    throw new InvalidArgsError("variants must be an array");
  }
  if (args.variants.length < 2 || args.variants.length > 4) {
    throw new InvalidArgsError("variants must contain 2 to 4 items");
  }

  const keys: VariantKey[] = [];
  for (const v of args.variants) {
    if (typeof v !== "string") {
      throw new InvalidArgsError("variants items must be strings");
    }
    const key = normalizeVariant(v);
    if (!key) {
      throw new InvalidArgsError(
        `unknown variant "${v}"; expected ${VARIANT_KEYS.join("|")}`,
      );
    }
    if (!keys.includes(key)) keys.push(key);
  }
  if (keys.length < 2) {
    throw new InvalidArgsError(
      "variants must contain at least 2 distinct items",
    );
  }

  if (args.situation !== undefined) {
    if (typeof args.situation !== "string") {
      throw new InvalidArgsError("situation must be a string");
    }
    if (args.situation.length > SITUATION_MAX_CHARS) {
      throw new InvalidArgsError(
        `situation exceeds ${SITUATION_MAX_CHARS} characters`,
      );
    }
  }

  const sections = keys.map((k) => readContent(`variants/${k}.md`).trimEnd());
  const parts = [
    "# Compare 5Ps variants",
    "",
    "Advanced forms appear as teasers. The full methods come through Helix.",
    "",
    ...sections.flatMap((s) => [s, ""]),
  ];

  if (args.situation?.trim()) {
    parts.push(
      "## Situation",
      args.situation.trim(),
      "",
      "Fit check: prefer the core loop unless the situation clearly needs volume (population), wide parallel agents (multi_agent), or non-linear jumps (rhizomatic). Full method via Helix: https://www.suhitanantula.com/5ps · https://www.suhitanantula.com/books/helix-moment · https://thehelixlab.ai",
      "",
    );
  }

  return parts.join("\n");
}
