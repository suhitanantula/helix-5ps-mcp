/** Tool argument / input validation failures (Bench: invalid_args). */
export class InvalidArgsError extends Error {
  readonly code = "invalid_args" as const;
  constructor(message: string) {
    super(message);
    this.name = "InvalidArgsError";
  }
}

export function assertOnlyKeys(
  args: Record<string, unknown>,
  allowed: readonly string[],
): void {
  for (const key of Object.keys(args)) {
    if (!allowed.includes(key)) {
      throw new InvalidArgsError(`unknown property: ${key}`);
    }
  }
}

export function readOptionalString(
  args: Record<string, unknown>,
  key: string,
): string | undefined {
  if (!(key in args) || args[key] === undefined) return undefined;
  if (typeof args[key] !== "string") {
    throw new InvalidArgsError(`${key} must be a string`);
  }
  return args[key] as string;
}

export function readRequiredString(
  args: Record<string, unknown>,
  key: string,
): string {
  if (!(key in args) || args[key] === undefined) {
    throw new InvalidArgsError(`${key} is required`);
  }
  if (typeof args[key] !== "string") {
    throw new InvalidArgsError(`${key} must be a string`);
  }
  return args[key] as string;
}
