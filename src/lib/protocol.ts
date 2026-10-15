/** Supported MCP protocol versions (echo client when listed). */
export const SUPPORTED_PROTOCOL_VERSIONS = [
  "2025-06-18",
  "2025-03-26",
  "2024-11-05",
] as const;

export type SupportedProtocolVersion =
  (typeof SUPPORTED_PROTOCOL_VERSIONS)[number];

/** Default when the client omits or sends an unknown version. */
export const DEFAULT_PROTOCOL_VERSION: SupportedProtocolVersion = "2025-06-18";

export function negotiateProtocolVersion(
  clientVersion: unknown,
): SupportedProtocolVersion {
  if (
    typeof clientVersion === "string" &&
    (SUPPORTED_PROTOCOL_VERSIONS as readonly string[]).includes(clientVersion)
  ) {
    return clientVersion as SupportedProtocolVersion;
  }
  return DEFAULT_PROTOCOL_VERSION;
}
