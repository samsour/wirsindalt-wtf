import { customAlphabet } from "nanoid";

// Short, friendly invite slugs: 6 chars, no ambiguous characters
const nano = customAlphabet("abcdefghjkmnpqrstuvwxyz23456789", 6);

export function makeSlug(name: string): string {
  // Take first word of group name + short id → "friday-3kx9p2"
  const base = name
    .toLowerCase()
    .split(/\s+/)[0]
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 12) || "group";
  return `${base}-${nano()}`;
}
