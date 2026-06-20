import type { TungaConfig } from "../types/index.js";

const events = new Set(["click", "change", "submit", "keydown", "keyup", "focus", "blur", "input", "load", "error"]);
const methods = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);

export function shouldIgnoreString(raw: string, config: TungaConfig): string | undefined {
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
  if (config.filters.ignoreClassNames && looksLikeClassName(value)) return "class name";

  return undefined;
}

function looksLikeClassName(value: string) {
  const parts = value.split(/\s+/);
  return (
    parts.length > 1 &&
    parts.every(
      (part) =>
        /^-?([a-z][\w-]*:)*(text|font|bg|border|p|m|px|py|mx|my|w|h|flex|grid|items|justify|rounded|shadow|gap|space|block|inline|hidden|container|opacity|z|overflow|relative|absolute|fixed|sticky)-[a-z0-9_\-[\]/.%#]+$/i.test(part) ||
        /^(flex|grid|block|inline-block|hidden|relative|absolute|fixed|sticky|sr-only|container)$/.test(part),
    )
  );
}

export function confidenceFor(text: string) {
  return text.length > 40 ? ("medium" as const) : ("high" as const);
}
