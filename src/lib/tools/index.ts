import {
  InvalidArgsError,
  assertOnlyKeys,
  readOptionalString,
  readRequiredString,
} from "../errors";
import { apply5ps } from "./apply";
import { diagnose5ps } from "./diagnose";
import { explain5ps } from "./explain";
import {
  compare5psVariants,
  get5psVariant,
  list5psVariants,
} from "./variants";

export type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

function textResult(payload: unknown, isError = false): ToolResult {
  const result: ToolResult = {
    content: [
      {
        type: "text",
        text:
          typeof payload === "string"
            ? payload
            : JSON.stringify(payload, null, 2),
      },
    ],
  };
  if (isError) result.isError = true;
  return result;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export const TOOL_DEFS = [
  {
    name: "explain_5ps",
    title: "Explain the 5Ps",
    description:
      "Overview of the 5Ps of Loop Design (Perceive → Perform → Portfolio → Pause/Promote → Progress), or a single P. Read-only; returns approved public text. Optional p and depth.",
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    inputSchema: {
      type: "object",
      properties: {
        p: {
          type: "string",
          description:
            "Optional P: perceive | perform | portfolio | pause_promote | progress",
        },
        depth: {
          type: "string",
          enum: ["short", "full"],
          description: "short = brief excerpt; full = complete public text",
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "diagnose_5ps",
    title: "Diagnose which P",
    description:
      "Which P do I need? Routes a problem to a 5Ps capacity (recommended_p) and a form (recommended_variant: loop | multi_agent | rhizomatic | population) with reasons and a one-line variant_reason, using public diagnostic cues. Problem text capped at 4,000 characters.",
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    inputSchema: {
      type: "object",
      properties: {
        problem: {
          type: "string",
          maxLength: 4000,
          description: "The situation or stuck point to route (max 4000 chars)",
        },
      },
      required: ["problem"],
      additionalProperties: false,
    },
  },
  {
    name: "apply_5ps",
    title: "Apply a P or the loop",
    description:
      "Question set and output template for one P, or the whole loop. Problem max 4,000 chars; context max 8,000. No LLM calls.",
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    inputSchema: {
      type: "object",
      properties: {
        problem: {
          type: "string",
          maxLength: 4000,
          description: "Situation to apply the method to",
        },
        p: {
          type: "string",
          description:
            "Optional P; omit for the full loop template (perceive|perform|portfolio|pause_promote|progress)",
        },
        context: {
          type: "string",
          maxLength: 8000,
          description: "Optional extra context (max 8000 chars)",
        },
      },
      required: ["problem"],
      additionalProperties: false,
    },
  },
  {
    name: "list_5ps_variants",
    title: "List 5Ps variants",
    description:
      "Names and one-liners for loop, multi_agent, rhizomatic, and population. Advanced forms are teasers only.",
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "get_5ps_variant",
    title: "Get a 5Ps variant teaser",
    description:
      "Teaser for a form: when to use, shape, first steps, and links to the books/site. Full advanced methods via Helix.",
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    inputSchema: {
      type: "object",
      properties: {
        variant: {
          type: "string",
          enum: ["loop", "multi_agent", "rhizomatic", "population"],
          description: "Which form to return",
        },
      },
      required: ["variant"],
      additionalProperties: false,
    },
  },
  {
    name: "compare_5ps_variants",
    title: "Compare 5Ps variants",
    description:
      "Side-by-side fit of 2–4 forms for a situation. Advanced forms remain teasers with Helix links.",
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    inputSchema: {
      type: "object",
      properties: {
        variants: {
          type: "array",
          minItems: 2,
          maxItems: 4,
          items: {
            type: "string",
            enum: ["loop", "multi_agent", "rhizomatic", "population"],
          },
          description: "2–4 variant ids to compare",
        },
        situation: {
          type: "string",
          maxLength: 4000,
          description: "Optional situation for fit notes (max 4000 chars)",
        },
      },
      required: ["variants"],
      additionalProperties: false,
    },
  },
] as const;

export async function callTool(
  name: string,
  rawArgs: unknown,
): Promise<ToolResult> {
  if (rawArgs !== undefined && rawArgs !== null && typeof rawArgs !== "object") {
    return textResult(
      { error: "invalid_args", message: "arguments must be an object" },
      true,
    );
  }
  const args = asRecord(rawArgs ?? {});
  try {
    switch (name) {
      case "explain_5ps": {
        assertOnlyKeys(args, ["p", "depth"]);
        return textResult(
          explain5ps({
            p: readOptionalString(args, "p"),
            depth: readOptionalString(args, "depth"),
          }),
        );
      }
      case "diagnose_5ps": {
        assertOnlyKeys(args, ["problem"]);
        return textResult(diagnose5ps(readRequiredString(args, "problem")));
      }
      case "apply_5ps": {
        assertOnlyKeys(args, ["problem", "p", "context"]);
        return textResult(
          apply5ps({
            problem: readRequiredString(args, "problem"),
            p: readOptionalString(args, "p"),
            context: readOptionalString(args, "context"),
          }),
        );
      }
      case "list_5ps_variants": {
        assertOnlyKeys(args, []);
        return textResult(list5psVariants());
      }
      case "get_5ps_variant": {
        assertOnlyKeys(args, ["variant"]);
        return textResult(get5psVariant(readRequiredString(args, "variant")));
      }
      case "compare_5ps_variants": {
        assertOnlyKeys(args, ["variants", "situation"]);
        if (!("variants" in args)) {
          throw new InvalidArgsError("variants is required");
        }
        if (!Array.isArray(args.variants)) {
          throw new InvalidArgsError("variants must be an array");
        }
        return textResult(
          compare5psVariants({
            variants: args.variants as string[],
            situation: readOptionalString(args, "situation"),
          }),
        );
      }
      default:
        return textResult(
          { error: "unknown_tool", message: `Unknown tool: ${name}` },
          true,
        );
    }
  } catch (err) {
    if (err instanceof InvalidArgsError) {
      return textResult({ error: "invalid_args", message: err.message }, true);
    }
    const message = err instanceof Error ? err.message : String(err);
    return textResult({ error: "tool_error", message }, true);
  }
}
