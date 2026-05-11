/**
 * SLA domain logic — pure functions for parsing, inferring, and computing SLA/KPI values.
 * Extracted from main.js (B-3) for testability and separation of concerns.
 */

export function parsePercent(value) {
  const match = String(value || "").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

export function parseDurationBusinessDays(value) {
  const match = String(value || "").trim().match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

export function inferSupportGroup(state) {
  if (state.sla?.supportGroup?.trim()) return state.sla.supportGroup.trim();
  const supportGroups = (state.support || []).map((row) => String(row.supportGroup || "").trim()).filter(Boolean);
  if (supportGroups.length) return supportGroups.join(", ");
  const systemActor = (state.actors || []).find((row) => /system/i.test(String(row.name || "")));
  return systemActor?.name?.trim() || "";
}

export function parseTeamList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Compute SLA health status from current state.
 * @returns {{ durationDays: number|null, notifGap: number|null, kpiCount: number, health: string, notifPreview: string }}
 */
export function computeSlaInsights(state) {
  const sla = state.sla || {};
  const slaParts = state.slaParts || [];
  const durationDays = parseDurationBusinessDays(sla.duration);
  const n1 = parsePercent(sla.notif1When);
  const n2 = parsePercent(sla.notif2When);
  const notifGap = n1 !== null && n2 !== null ? n2 - n1 : null;
  const kpiCount = Array.isArray(state.kpis) ? state.kpis.length : 0;

  const essentials = [sla.service, sla.requester, sla.supportGroup, sla.duration].filter((v) => String(v || "").trim()).length;
  const hasSplitSla = slaParts.some((row) => String(row.team || "").trim() && String(row.duration || "").trim());
  const health = hasSplitSla || essentials === 4 ? "Ready" : essentials >= 2 ? "In progress" : "Needs input";

  const teams = parseTeamList(sla.supportGroup);
  const teamsLabel = teams.length ? teams.join(", ") : "No team selected";
  const who1 = sla.notif1Who || "First owner";
  const when1 = sla.notif1When || "first threshold";
  const who2 = sla.notif2Who || "Second owner";
  const when2 = sla.notif2When || "second threshold";
  const notifPreview = `Teams: ${teamsLabel}. Escalation: ${who1} at ${when1}, then ${who2} at ${when2}.`;

  return { durationDays, notifGap, kpiCount, health, notifPreview };
}

/** KPI starter pack rows. */
export function buildKpiStarters(owner) {
  return [
    {
      name: "% Of requests completed within agreed time",
      formula: "# completed within SLA / total # of requests",
      target: ">= 95%",
      owner,
      frequency: "Monthly"
    },
    {
      name: "Average fulfillment lead time",
      formula: "sum of request lead time / total # of requests",
      target: "<= 5 business days",
      owner,
      frequency: "Monthly"
    },
    {
      name: "Reopened request ratio",
      formula: "# reopened requests / total # of requests",
      target: "<= 3%",
      owner,
      frequency: "Quarterly"
    }
  ];
}
