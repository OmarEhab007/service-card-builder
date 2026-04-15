/**
 * Muted accent + tint pairs for workflow visuals (professional, print-friendly).
 * `solid` / `light` kept as names for template compatibility — use as accent + row tint.
 */
export function getActorPalette(actorName) {
  const raw = String(actorName || "").trim();
  const a = raw.toLowerCase();

  const pick = (accent, tint) => ({ solid: accent, light: tint, key: raw || "Team" });

  if (/requester\s+manager|manager\s+approval/i.test(a) || (a.includes("manager") && a.includes("requester"))) {
    return pick("#0d9488", "#f0fdfa");
  }
  if (/business\s+owner/i.test(a)) {
    return pick("#7c6aed", "#f5f3ff");
  }
  if (/enterprise|(\b|^)ea(\b|$)|architecture/i.test(a)) {
    return pick("#c2410c", "#fff7ed");
  }
  if (/\bdb\b|database/i.test(a)) {
    return pick("#be123c", "#fff1f2");
  }
  if (/network/i.test(a) && /system/i.test(a)) {
    return pick("#0f766e", "#f0fdfa");
  }
  if (/network/i.test(a)) {
    return pick("#0f766e", "#ecfeff");
  }
  if (/monitoring/i.test(a)) {
    return pick("#166534", "#f7fee7");
  }
  if (/system/i.test(a)) {
    return pick("#475569", "#f8fafc");
  }
  if (/^requester$/i.test(raw) || (a.includes("requester") && !a.includes("manager"))) {
    return pick("#2563eb", "#eff6ff");
  }
  if (/start|submit|closed|complete/i.test(a)) {
    return pick("#1e40af", "#eef2ff");
  }

  return pick("#64748b", "#f8fafc");
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
