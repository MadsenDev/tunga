import type { CandidateString, TungaConfig } from "../types/index.js";

const events = new Set(["click", "change", "submit", "keydown", "keyup", "focus", "blur", "input", "load", "error"]);
const methods = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);

export function shouldIgnoreString(raw: string, config: TungaConfig, context?: { strongUi?: boolean }): string | undefined {
  const value = raw.trim();

  if (value.length < config.filters.minLength) return "too short";
  if (config.filters.ignorePunctuationOnly && /^[\p{P}\p{S}\s]+$/u.test(value)) return "punctuation only";
  if (config.filters.ignoreNumbers && /^[\d\s.,:-]+$/.test(value)) return "numeric";
  if (/^https?:\/\//.test(value) || /^mailto:/.test(value)) return "url";
  if (config.filters.ignoreRoutes && /^(\/|\.\/|\.\.\/)[\w./:[\]-]*$/.test(value)) return "route or path";
  if (/^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(value)) return "email";
  if (/^#[0-9a-fA-F]{3,8}$/.test(value)) return "color";
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) return "uuid";
  if (methods.has(value)) return "http method";
  if (/^[\w.+-]+\/[\w.+-]+$/.test(value)) return "mime type";
  if (/^[A-Z][A-Z0-9_]+$/.test(value)) return "environment variable";
  if (events.has(value)) return "event name";
  if (/^[a-z][a-z0-9-]+(\.[a-z][a-z0-9-]+)+$/.test(value)) return "dotted key";
  if (config.filters.ignoreCodeLike && /(=>|\bwindow\.|==|\);|\bfunction\s*\(|\w+\([^)]*\)\s*[{;]?)/.test(value)) return "code-like string";
  if (config.filters.ignoreClassNames && looksLikeClassName(value)) return "class name";
  if (config.filters.ignoreShortLowercase && !context?.strongUi && /^[a-z][a-z\s-]*$/.test(value) && value.split(/\s+/).length <= 2) return "ambiguous short lowercase";

  return undefined;
}

function looksLikeClassName(value: string) {
  const parts = value.split(/\s+/);
  return (
    parts.length > 0 &&
    parts.every(
      (part) =>
        /^!?-?([a-z][\w-]*:)*(text|font|bg|border|p|m|px|py|pt|pb|pl|pr|mt|mb|ml|mr|mx|my|w|h|min-w|min-h|max-w|max-h|flex|grid|items|content|self|justify|rounded|shadow|gap|space|block|inline|hidden|container|opacity|z|overflow|relative|absolute|fixed|sticky|inset|top|bottom|left|right|leading|tracking|uppercase|lowercase|capitalize|truncate|align|decoration|underline|ring|outline|divide|place|col|row|order|basis|grow|shrink|translate|scale|rotate|duration|ease|transition|animate|cursor|select|pointer-events)-[a-z0-9_\-[\]()/.,:%#]+$/i.test(part) ||
        /^(flex|grid|block|inline|inline-block|hidden|relative|absolute|fixed|sticky|sr-only|container|uppercase|lowercase|capitalize|truncate)$/.test(part),
    )
  );
}

export function confidenceFor(text: string, context: Pick<CandidateString, "type"> & { strongUi?: boolean; hasInterpolation?: boolean }) {
  if (context.type === "jsx-text" || context.type === "jsx-attribute") return "high" as const;
  if (context.type === "jsx-mixed" || context.hasInterpolation) return "medium" as const;
  if (context.strongUi || /^[A-Z]/.test(text)) return "medium" as const;
  if (text.length > 40) return "medium" as const;
  return "low" as const;
}
