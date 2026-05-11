/**
 * SLA form binding — connects SLA/KPI form fields and action buttons to state.
 * Extracted from main.js (B-3).
 */
import { $ } from "../utils/dom.js";
import { getState, patchState } from "../state/store.js";
import { inferSupportGroup, parseTeamList, computeSlaInsights, buildKpiStarters } from "../domain/sla-logic.js";

export function bindSlaFields(fillFormFromState) {
  const map = {
    slaService: "service",
    slaRequester: "requester",
    slaPrerequisites: "prerequisites",
    slaSupportGroup: "supportGroup",
    slaControls: "controls",
    slaDuration: "duration",
    notif1Who: "notif1Who",
    notif1When: "notif1When",
    notif2Who: "notif2Who",
    notif2When: "notif2When"
  };
  Object.entries(map).forEach(([id, key]) => {
    const input = $("#" + id);
    const sync = () => {
      patchState((state) => {
        if (!state.sla) state.sla = {};
        if (id === "slaService") {
          state.sla.mirrorServiceName = false;
        }
        state.sla[key] = input.value;
      });
    };
    input.addEventListener("input", sync);
    input.addEventListener("change", sync);
  });

  const mirror = $("#slaMirrorService");
  mirror.addEventListener("change", () => {
    patchState((state) => {
      state.sla.mirrorServiceName = mirror.checked;
      if (state.sla.mirrorServiceName) {
        state.sla.service = state.identity.name || "";
      }
    });
    fillFormFromState();
  });
}

export function renderSlaKpiInsights() {
  const state = getState();
  const insights = computeSlaInsights(state);

  const durationEl = $("#slaDurationDays");
  const gapEl = $("#slaNotifGap");
  const kpiCountEl = $("#kpiCount");
  const healthEl = $("#slaHealth");
  const notifPreview = $("#slaNotificationPreview");

  if (durationEl) {
    durationEl.textContent =
      insights.durationDays !== null
        ? `${insights.durationDays} business day${insights.durationDays === 1 ? "" : "s"}`
        : "Not set";
  }
  if (gapEl) {
    gapEl.textContent = insights.notifGap !== null ? `${insights.notifGap}%` : "Not set";
  }
  if (kpiCountEl) {
    kpiCountEl.textContent = String(insights.kpiCount);
  }
  if (healthEl) {
    healthEl.textContent = insights.health;
  }
  if (notifPreview) {
    notifPreview.textContent = insights.notifPreview;
  }
}

export function bindSlaKpiActions(fillFormFromState, editorRefs) {
  const smartFillBtn = $("#btnSlaSmartFill");
  if (smartFillBtn) {
    smartFillBtn.addEventListener("click", () => {
      patchState((state) => {
        if (!state.sla) state.sla = {};
        if (!state.sla.service || state.sla.mirrorServiceName !== false) {
          state.sla.service = state.identity?.name || "";
        }
        if (!state.sla.requester?.trim()) {
          state.sla.requester = "IT Users";
        }
        if (!state.sla.supportGroup?.trim()) {
          state.sla.supportGroup = inferSupportGroup(state);
        }
        if (!state.sla.controls?.trim()) {
          state.sla.controls = "Multiple Approvals Required";
        }
        if (!state.sla.prerequisites?.trim()) {
          state.sla.prerequisites = "-";
        }
      });
      fillFormFromState();
    });
  }

  const autoNotifBtn = $("#btnSlaAutoNotif");
  if (autoNotifBtn) {
    autoNotifBtn.addEventListener("click", () => {
      patchState((state) => {
        if (!state.sla) state.sla = {};
        const teams = parseTeamList(state.sla.supportGroup) || [];
        const primary = teams[0] || inferSupportGroup(state) || "Support Team";
        const secondary = teams[1] || primary;
        if (!state.sla.notif1Who?.trim()) state.sla.notif1Who = `${primary} supervisor`;
        if (!state.sla.notif2Who?.trim()) state.sla.notif2Who = `${secondary} manager`;
        state.sla.notif1When = "75%";
        state.sla.notif2When = "90%";
      });
      fillFormFromState();
    });
  }

  const starterPackBtn = $("#btnKpiStarterPack");
  if (starterPackBtn) {
    starterPackBtn.addEventListener("click", () => {
      patchState((state) => {
        const owner = inferSupportGroup(state) || "System Team";
        const existingNames = new Set((state.kpis || []).map((kpi) => String(kpi.name || "").toLowerCase().trim()));
        const starters = buildKpiStarters(owner);
        if (!Array.isArray(state.kpis)) state.kpis = [];
        starters.forEach((row) => {
          const key = row.name.toLowerCase().trim();
          if (!existingNames.has(key)) {
            state.kpis.push(row);
            existingNames.add(key);
          }
        });
      });
      if (typeof editorRefs.kpis?.render === "function") {
        editorRefs.kpis.render();
      }
      renderSlaKpiInsights();
    });
  }

  const kpiBlankBtn = $("#btnKpiAddBlank");
  if (kpiBlankBtn) {
    kpiBlankBtn.addEventListener("click", () => {
      patchState((state) => {
        if (!Array.isArray(state.kpis)) state.kpis = [];
        state.kpis.push({ name: "", formula: "", target: "", owner: inferSupportGroup(state) || "", frequency: "Monthly" });
      });
      if (typeof editorRefs.kpis?.render === "function") {
        editorRefs.kpis.render();
      }
      renderSlaKpiInsights();
    });
  }

  [
    ["btnDuration3BD", "3BD"],
    ["btnDuration5BD", "5BD"],
    ["btnDuration10BD", "10BD"]
  ].forEach(([id, value]) => {
    const btn = $("#" + id);
    if (!btn) return;
    btn.addEventListener("click", () => {
      patchState((state) => {
        if (!state.sla) state.sla = {};
        state.sla.duration = value;
      });
      fillFormFromState();
    });
  });

  const splitBtn = $("#btnSlaSplitByTeams");
  if (splitBtn) {
    splitBtn.addEventListener("click", () => {
      patchState((state) => {
        const explicitTeams = parseTeamList(state.sla?.supportGroup);
        const supportTeams = (state.support || []).map((row) => String(row.supportGroup || "").trim()).filter(Boolean);
        const sourceTeams = explicitTeams.length ? explicitTeams : supportTeams;
        if (!Array.isArray(state.slaParts)) state.slaParts = [];
        if (!sourceTeams.length) {
          if (!state.slaParts.length) {
            state.slaParts.push({
              part: "Part 1",
              team: "",
              scope: "Main request processing",
              duration: state.sla?.duration || "5BD",
              target: "Within agreed timeline"
            });
          }
          return;
        }
        state.slaParts = sourceTeams.slice(0, 5).map((team, idx) => ({
          part: `Part ${idx + 1}`,
          team,
          scope: idx === 0 ? "Initial handling" : idx === sourceTeams.length - 1 ? "Final delivery" : "Intermediate handoff",
          duration: idx === 0 ? "2BD" : "1BD",
          target: "On-time completion"
        }));
      });
      if (typeof editorRefs.slaParts?.render === "function") {
        editorRefs.slaParts.render();
      }
      renderSlaKpiInsights();
    });
  }
}

/**
 * Sync SLA fields from state to DOM, skipping the currently focused element.
 */
export function syncSlaFields(state, setControlIfNotFocused) {
  const sla = state.sla || {};
  const mirrorOn = sla.mirrorServiceName !== false;

  setControlIfNotFocused($("#slaService"), sla.service || "");
  const slaSvc = $("#slaService");
  if (document.activeElement !== slaSvc) {
    slaSvc.readOnly = mirrorOn;
  }
  setControlIfNotFocused($("#slaMirrorService"), mirrorOn, "checked");
  setControlIfNotFocused($("#slaRequester"), sla.requester || "");
  setControlIfNotFocused($("#slaPrerequisites"), sla.prerequisites || "");
  setControlIfNotFocused($("#slaSupportGroup"), sla.supportGroup || "");
  setControlIfNotFocused($("#slaControls"), sla.controls || "");
  setControlIfNotFocused($("#slaDuration"), sla.duration || "");
  setControlIfNotFocused($("#notif1Who"), sla.notif1Who || "");
  setControlIfNotFocused($("#notif1When"), sla.notif1When || "");
  setControlIfNotFocused($("#notif2Who"), sla.notif2Who || "");
  setControlIfNotFocused($("#notif2When"), sla.notif2When || "");

  renderSlaKpiInsights();
}
