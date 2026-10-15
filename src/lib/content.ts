import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const CONTENT_ROOT = join(process.cwd(), "content");

/** Strip YAML frontmatter; return body text exactly as stored. */
export function stripFrontmatter(raw: string): string {
  if (!raw.startsWith("---\n")) return raw;
  const end = raw.indexOf("\n---\n", 4);
  if (end === -1) return raw;
  return raw.slice(end + 5);
}

export function readContent(relativePath: string): string {
  const full = join(CONTENT_ROOT, relativePath);
  if (!existsSync(full)) {
    throw new Error(`content_missing: ${relativePath}`);
  }
  return stripFrontmatter(readFileSync(full, "utf8"));
}

export function readContentRaw(relativePath: string): string {
  const full = join(CONTENT_ROOT, relativePath);
  if (!existsSync(full)) {
    throw new Error(`content_missing: ${relativePath}`);
  }
  return readFileSync(full, "utf8");
}

export function contentRoot(): string {
  return CONTENT_ROOT;
}

export type PKey =
  | "perceive"
  | "perform"
  | "portfolio"
  | "pause_promote"
  | "progress";

export const P_KEYS: readonly PKey[] = [
  "perceive",
  "perform",
  "portfolio",
  "pause_promote",
  "progress",
] as const;

export const P_ALIASES: Record<string, PKey> = {
  perceive: "perceive",
  perform: "perform",
  portfolio: "portfolio",
  pause_promote: "pause_promote",
  "pause/promote": "pause_promote",
  "pause-promote": "pause_promote",
  pausepromote: "pause_promote",
  progress: "progress",
};

export function normalizeP(value: string | undefined): PKey | undefined {
  if (!value) return undefined;
  const key = value.trim().toLowerCase().replace(/\s+/g, "_");
  return P_ALIASES[key] ?? P_ALIASES[key.replace(/-/g, "_")];
}

export type VariantKey = "loop" | "multi_agent" | "rhizomatic" | "population";

export const VARIANT_KEYS: readonly VariantKey[] = [
  "loop",
  "multi_agent",
  "rhizomatic",
  "population",
] as const;

export function normalizeVariant(
  value: string | undefined,
): VariantKey | undefined {
  if (!value) return undefined;
  const key = value.trim().toLowerCase().replace(/-/g, "_");
  return (VARIANT_KEYS as readonly string[]).includes(key)
    ? (key as VariantKey)
    : undefined;
}
