/**
 * Muted accent + tint pairs for workflow visuals (professional, print-friendly).
 * `solid` / `light` kept as names for template compatibility — use as accent + row tint.
 *
 * B-9: Named overrides for common actors, plus a deterministic hash-based fallback
 * so any custom actor name gets a unique, consistent color.
 */

/** Named color overrides for well-known actor labels. */
const NAMED_PALETTES = [
  { pattern: /requester\s+manager|manager\s+approval/i, solid: "#0d9488", light: "#f0fdfa" },
  { pattern: /business\s+owner/i, solid: "#7c6aed", light: "#f5f3ff" },
  { pattern: /enterprise|(\b|^)ea(\b|$)|architecture/i, solid: "#c2410c", light: "#fff7ed" },
  { pattern: /\bdb\b|database/i, solid: "#be123c", light: "#fff1f2" },
  { pattern: /security/i, solid: "#7e22ce", light: "#faf5ff" },
  { pattern: /monitoring/i, solid: "#166534", light: "#f7fee7" },
  // "System / Network" combo before individual matches
  { pattern: /network.*system|system.*network/i, solid: "#0f766e", light: "#f0fdfa" },
  { pattern: /network/i, solid: "#0f766e", light: "#ecfeff" },
  { pattern: /system/i, solid: "#475569", light: "#f8fafc" },
  { pattern: /^requester$/i, solid: "#2563eb", light: "#eff6ff" },
  { pattern: /start|submit|closed|complete/i, solid: "#1e40af", light: "#eef2ff" }
];

/**
 * Simple string hash → deterministic hue in HSL space.
 * Produces muted, print-friendly colors (saturation 40-55%, lightness 35-45%).
 */
function hashColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  const hue = ((hash % 360) + 360) % 360;
  const solid = `hsl(${hue}, 48%, 38%)`;
  const light = `hsl(${hue}, 35%, 96%)`;
  return { solid, light };
}

export function getActorPalette(actorName) {
  const raw = String(actorName || "").trim();
  const a = raw.toLowerCase();

  // Check named overrides first
  for (const entry of NAMED_PALETTES) {
    if (entry.pattern.test(a)) {
      return { solid: entry.solid, light: entry.light, key: raw || "Team" };
    }
  }

  // Requester (partial match, after manager check)
  if (a.includes("requester") && !a.includes("manager")) {
    return { solid: "#2563eb", light: "#eff6ff", key: raw || "Team" };
  }

  // Deterministic hash-based color for any other actor name
  if (raw) {
    const { solid, light } = hashColor(a);
    return { solid, light, key: raw };
  }

  // Absolute fallback
  return { solid: "#64748b", light: "#f8fafc", key: "Team" };
}

/** Unique actors in workflow order for legend + flow path */
export function uniqueWorkflowActors(workflow) {
  const seen = new Set();
  const out = [];
  for (const w of workflow || []) {
    const label = String(w.actor || "").trim();
    if (!label || seen.has(label.toLowerCase())) continue;
    seen.add(label.toLowerCase());
    out.push(label);
  }
  return out;
}

export function outcomeTone(type) {
  const t = String(type || "").toLowerCase();
  if (t.includes("start")) return { class: "outcome--start", label: "Start" };
  if (t.includes("decision")) return { class: "outcome--decision", label: "Decision" };
  if (t.includes("end") || t.includes("close")) return { class: "outcome--end", label: "Complete" };
  if (t.includes("action")) return { class: "outcome--action", label: "Fulfill" };
  return { class: "outcome--neutral", label: "Flow" };
}
