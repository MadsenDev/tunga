import * as t from "@babel/types";

const technicalKeys = new Set([
  "icon", "className", "class", "id", "type", "variant", "color", "size", "href", "src", "route", "path", "url", "endpoint", "method", "headers", "event", "handler",
]);

const uiKeys = new Set(["label", "title", "description", "message", "placeholder", "text", "emptyState"]);

export function objectPropertyKeyName(property: t.ObjectProperty | t.ObjectMethod): string | undefined {
  const key = property.key;
  if (t.isIdentifier(key)) return key.name;
  if (t.isStringLiteral(key)) return key.value;
  return undefined;
}

export function isTechnicalObjectPropertyKey(key: string) {
  return technicalKeys.has(key) || /(?:handler|callback|url|uri|path|route|endpoint)$/i.test(key);
}

export function isUiObjectPropertyKey(key: string) {
  return uiKeys.has(key);
}
