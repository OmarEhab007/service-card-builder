import { describe, it, expect } from "vitest";
import { parsePercent, parseDurationBusinessDays, inferSupportGroup, parseTeamList, computeSlaInsights, buildKpiStarters } from "../src/js/domain/sla-logic.js";

describe("parsePercent", () => {
  it("extracts percentage from string", () => {
    expect(parsePercent("75%")).toBe(75);
    expect(parsePercent("90.5%")).toBe(90.5);
  });

  it("returns null for empty/invalid", () => {
    expect(parsePercent("")).toBe(null);
    expect(parsePercent(null)).toBe(null);
    expect(parsePercent("no number")).toBe(null);
  });
});

describe("parseDurationBusinessDays", () => {
  it("extracts number from duration strings", () => {
    expect(parseDurationBusinessDays("5BD")).toBe(5);
    expect(parseDurationBusinessDays("3BD")).toBe(3);
    expect(parseDurationBusinessDays("10BD")).toBe(10);
  });

  it("returns null for empty", () => {
    expect(parseDurationBusinessDays("")).toBe(null);
    expect(parseDurationBusinessDays(null)).toBe(null);
  });
});

describe("inferSupportGroup", () => {
  it("returns explicit sla.supportGroup if set", () => {
    const state = { sla: { supportGroup: "IT Team" }, support: [], actors: [] };
    expect(inferSupportGroup(state)).toBe("IT Team");
  });

  it("falls back to support table entries", () => {
    const state = { sla: {}, support: [{ supportGroup: "Network Team" }], actors: [] };
    expect(inferSupportGroup(state)).toBe("Network Team");
  });

  it("falls back to system actor name", () => {
    const state = { sla: {}, support: [], actors: [{ name: "System Team" }] };
    expect(inferSupportGroup(state)).toBe("System Team");
  });

  it("returns empty string when nothing found", () => {
    const state = { sla: {}, support: [], actors: [] };
    expect(inferSupportGroup(state)).toBe("");
  });
});

describe("parseTeamList", () => {
  it("splits comma-separated teams", () => {
    expect(parseTeamList("System, Network, DB")).toEqual(["System", "Network", "DB"]);
  });

  it("handles single team", () => {
    expect(parseTeamList("System")).toEqual(["System"]);
  });

  it("handles empty/null", () => {
    expect(parseTeamList("")).toEqual([]);
    expect(parseTeamList(null)).toEqual([]);
  });
});

describe("computeSlaInsights", () => {
  it("computes health as Ready when all essentials are filled", () => {
    const state = {
      sla: { service: "Test", requester: "User", supportGroup: "Team", duration: "5BD", notif1When: "75%", notif2When: "90%" },
      slaParts: [],
      kpis: []
    };
    const insights = computeSlaInsights(state);
    expect(insights.health).toBe("Ready");
    expect(insights.durationDays).toBe(5);
    expect(insights.notifGap).toBe(15);
    expect(insights.kpiCount).toBe(0);
  });

  it("computes health as Needs input when nothing filled", () => {
    const state = { sla: {}, slaParts: [], kpis: [] };
    const insights = computeSlaInsights(state);
    expect(insights.health).toBe("Needs input");
  });
});

describe("buildKpiStarters", () => {
  it("returns 3 starter KPIs", () => {
    const starters = buildKpiStarters("System Team");
    expect(starters).toHaveLength(3);
    expect(starters[0].owner).toBe("System Team");
    expect(starters.every((k) => k.name && k.formula && k.target)).toBe(true);
  });
});
