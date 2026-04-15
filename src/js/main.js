import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import { initNavigation } from "./ui/navigation.js";
import { TableEditor } from "./ui/table-editor.js";
import { $, downloadFile } from "./utils/dom.js";
import { getState, loadDraft, patchState, replaceState, subscribe } from "./state/store.js";
import { enterpriseTemplate } from "./state/template.js";
import { exportHtml, exportMarkdown, printPdf } from "./export/exporters.js";

let svcDatePicker = null;

function initSvcDatePicker() {
  const el = $("#svcDate");
  svcDatePicker = flatpickr(el, {
    dateFormat: "Y-m-d",
    allowInput: true,
    disableMobile: true,
    onChange(_dates, dateStr) {
      patchState((s) => {
        s.identity.date = dateStr;
      });
    }
  });
  el.addEventListener("change", () => {
    patchState((s) => {
      s.identity.date = el.value.trim();
    });
  });
}

function bindIdentityFields() {
  const map = {
    svcName: ["identity", "name"],
    svcNameAr: ["identity", "nameAr"],
    svcDesc: ["identity", "description"],
    svcDescAr: ["identity", "descriptionAr"],
    svcVersion: ["identity", "version"],
    svcCategory: ["identity", "category"],
    svcStatus: ["identity", "status"],
    svcOwner: ["identity", "owner"],
    svcId: ["identity", "id"]
  };

  Object.entries(map).forEach(([id, [scope, key]]) => {
    const input = $("#" + id);
    input.addEventListener("input", () => {
      patchState((state) => {
        state[scope][key] = input.value;
      });
    });
  });
}

function bindSlaFields() {
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

function parsePercent(value) {
  const match = String(value || "").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function parseDurationBusinessDays(value) {
  const match = String(value || "").trim().match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function inferSupportGroup(state) {
  if (state.sla?.supportGroup?.trim()) return state.sla.supportGroup.trim();
  const supportGroups = (state.support || []).map((row) => String(row.supportGroup || "").trim()).filter(Boolean);
  if (supportGroups.length) return supportGroups.join(", ");
  const systemActor = (state.actors || []).find((row) => /system/i.test(String(row.name || "")));
  return systemActor?.name?.trim() || "";
}

function parseTeamList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function renderSlaKpiInsights() {
  const state = getState();
  const sla = state.sla || {};
  const slaParts = state.slaParts || [];
  const durationDays = parseDurationBusinessDays(sla.duration);
  const n1 = parsePercent(sla.notif1When);
  const n2 = parsePercent(sla.notif2When);
  const gap = n1 != null && n2 != null ? n2 - n1 : null;

  const durationEl = $("#slaDurationDays");
  const gapEl = $("#slaNotifGap");
  const kpiCountEl = $("#kpiCount");
  const healthEl = $("#slaHealth");
  const notifPreview = $("#slaNotificationPreview");

  if (durationEl) {
    durationEl.textContent = durationDays != null ? `${durationDays} business day${durationDays === 1 ? "" : "s"}` : "Not set";
  }
  if (gapEl) {
    gapEl.textContent = gap != null ? `${gap}%` : "Not set";
  }
  if (kpiCountEl) {
    const count = Array.isArray(state.kpis) ? state.kpis.length : 0;
    kpiCountEl.textContent = String(count);
  }
  if (healthEl) {
    const essentials = [sla.service, sla.requester, sla.supportGroup, sla.duration].filter((v) => String(v || "").trim()).length;
    const hasSplitSla = slaParts.some((row) => String(row.team || "").trim() && String(row.duration || "").trim());
    healthEl.textContent = hasSplitSla || essentials === 4 ? "Ready" : essentials >= 2 ? "In progress" : "Needs input";
  }
  if (notifPreview) {
    const teams = parseTeamList(sla.supportGroup);
    const teamsLabel = teams.length ? teams.join(", ") : "No team selected";
    const who1 = sla.notif1Who || "First owner";
    const when1 = sla.notif1When || "first threshold";
    const who2 = sla.notif2Who || "Second owner";
    const when2 = sla.notif2When || "second threshold";
    notifPreview.textContent = `Teams: ${teamsLabel}. Escalation: ${who1} at ${when1}, then ${who2} at ${when2}.`;
  }
}

function bindSlaKpiActions() {
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
        const starters = [
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
        if (!Array.isArray(state.kpis)) state.kpis = [];
        starters.forEach((row) => {
          const key = row.name.toLowerCase().trim();
          if (!existingNames.has(key)) {
            state.kpis.push(row);
            existingNames.add(key);
          }
        });
      });
      if (typeof kpisEditorRef?.render === "function") {
        kpisEditorRef.render();
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
      if (typeof kpisEditorRef?.render === "function") {
        kpisEditorRef.render();
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
      if (typeof slaPartsEditorRef?.render === "function") {
        slaPartsEditorRef.render();
      }
      renderSlaKpiInsights();
    });
  }
}

function setControlIfNotFocused(el, value, attr = "value") {
  if (!el) return;
  if (document.activeElement === el) return;
  if (attr === "value") el.value = value;
  else if (attr === "checked") el.checked = !!value;
  else if (attr === "readOnly") el.readOnly = !!value;
}

function fillFormFromState() {
  const state = getState();
  const sla = state.sla || {};
  const mirrorOn = sla.mirrorServiceName !== false;

  setControlIfNotFocused($("#svcName"), state.identity.name || "");
  setControlIfNotFocused($("#svcNameAr"), state.identity.nameAr || "");
  setControlIfNotFocused($("#svcDesc"), state.identity.description || "");
  setControlIfNotFocused($("#svcDescAr"), state.identity.descriptionAr || "");
  setControlIfNotFocused($("#svcVersion"), state.identity.version || "1.0");
  setControlIfNotFocused($("#svcCategory"), state.identity.category || "");
  setControlIfNotFocused($("#svcStatus"), state.identity.status || "");
  setControlIfNotFocused($("#svcOwner"), state.identity.owner || "");
  setControlIfNotFocused($("#svcId"), state.identity.id || "");

  const dateVal = state.identity.date || "";
  const dateEl = $("#svcDate");
  if (document.activeElement !== dateEl) {
    dateEl.value = dateVal;
    if (svcDatePicker) {
      if (dateVal) {
        svcDatePicker.setDate(dateVal, false, "Y-m-d");
      } else {
        svcDatePicker.clear();
      }
    }
  }

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

function loadEnterpriseExample() {
  replaceState(JSON.parse(JSON.stringify(enterpriseTemplate)));
  fillFormFromState();
  rerenderAllTableEditors();
}

/** Table bodies are not re-rendered on every keystroke; refresh after wholesale state replace. */
let rerenderAllTableEditors = () => {};

let workflowEditorRef;
let raciEditorRef;
let kpisEditorRef;
let slaPartsEditorRef;

const RACI_VALUE_OPTIONS = ["A/R", "A", "R", "C", "I", "-"];

function getRaciRoles() {
  const roles = getState()?.raciConfig?.roles;
  return Array.isArray(roles) && roles.length ? roles : [{ key: "requester", label: "Requester" }];
}

function buildRaciDefaultRow() {
  const row = { step: "" };
  getRaciRoles().forEach((role) => {
    row[role.key] = "-";
  });
  return row;
}

function buildRaciColumns() {
  return [
    { key: "step", label: "STEP (from Workflow)", readonly: true },
    ...getRaciRoles().map((role) => ({
      key: role.key,
      label: role.label,
      type: "select",
      options: RACI_VALUE_OPTIONS
    }))
  ];
}

function initEditors() {
  const editors = [
    new TableEditor({
      mountId: "actorsEditor",
      stateKey: "actors",
      columns: [
        { key: "name", label: "Name" },
        { key: "role", label: "Role" },
        { key: "department", label: "Department" },
        { key: "email", label: "Email" }
      ],
      defaultRow: { name: "", role: "", department: "", email: "" },
      emptyMessage:
        "List each role or team once. Names you enter here appear as suggestions in Workflow → Actor and SLA/KPIs. Use Copy to duplicate a row.",
      addRowLabel: "Add actor"
    }),
    (workflowEditorRef = new TableEditor({
      mountId: "workflowEditor",
      stateKey: "workflow",
      pairedStateKey: "raci",
      pairedDefaultRow: buildRaciDefaultRow(),
      columns: [
        { key: "step", label: "Step" },
        {
          key: "actor",
          label: "Actor",
          type: "datalist",
          optionsFromActors: true,
          placeholder: "Pick from list or type a team"
        },
        { key: "type", label: "Type" },
        { key: "duration", label: "Duration" },
        { key: "condition", label: "Condition" }
      ],
      defaultRow: { step: "", actor: "", type: "Action", duration: "", condition: "" },
      emptyMessage:
        "Define the official sequence of steps. RACI rows stay aligned to these steps automatically — edit the step text here only.",
      addRowLabel: "Add workflow step"
    })),
    new TableEditor({
      mountId: "fieldsEditor",
      stateKey: "fields",
      columns: [
        { key: "nameEn", label: "Field Name (English)" },
        { key: "nameAr", label: "Field Name (Arabic)" },
        { key: "type", label: "Field Type", type: "select", options: ["Text", "Text (AD Browse)", "Menu", "Multiple Fields", "Long Text", "Date", "Number"] },
        { key: "values", label: "Field Initial Values", type: "textarea" },
        { key: "questionAr", label: "Arabic Question", type: "textarea" },
        { key: "mandatory", label: "Mandatory", type: "select", options: ["X", "-"] },
        { key: "dependency", label: "Dependency" }
      ],
      defaultRow: { nameEn: "", nameAr: "", type: "Text", values: "", questionAr: "", mandatory: "X", dependency: "-" },
      emptyMessage: "Each row is one form field. Use “Copy” on a similar row to duplicate it, then adjust text — it is faster than starting from scratch.",
      addRowLabel: "Add form field"
    }),
    (raciEditorRef = new TableEditor({
      mountId: "raciEditor",
      stateKey: "raci",
      structuralEdits: false,
      columns: buildRaciColumns(),
      defaultRow: buildRaciDefaultRow(),
      emptyMessage:
        "Add or reorder steps in the Workflow tab first — RACI rows are created automatically to match. Then set A/R, R, C, or I per column (use “-” when not applicable).",
      addRowLabel: "Add RACI row"
    })),
    new TableEditor({
      mountId: "supportEditor",
      stateKey: "support",
      columns: [
        { key: "supportGroup", label: "Support Group" },
        { key: "names", label: "Names" },
        { key: "emails", label: "Emails" }
      ],
      defaultRow: { supportGroup: "", names: "", emails: "" },
      emptyMessage: "List operational support groups and contacts. Separate multiple names or emails with commas if needed.",
      addRowLabel: "Add support group"
    }),
    (slaPartsEditorRef = new TableEditor({
      mountId: "slaPartsEditor",
      stateKey: "slaParts",
      columns: [
        { key: "part", label: "Part / Phase" },
        { key: "team", label: "Responsible Team" },
        { key: "scope", label: "Scope" },
        { key: "duration", label: "SLA Duration" },
        { key: "target", label: "Target / Commitment" }
      ],
      defaultRow: { part: "", team: "", scope: "", duration: "", target: "" },
      emptyMessage:
        "Split one request into multiple SLA parts. Each row maps to a team with its own SLA duration and target.",
      addRowLabel: "Add SLA part"
    })),
    (kpisEditorRef = new TableEditor({
      mountId: "kpisEditor",
      stateKey: "kpis",
      columns: [
        { key: "name", label: "KPIs" },
        { key: "formula", label: "Formula" },
        { key: "target", label: "Target" },
        {
          key: "owner",
          label: "Responsibility",
          type: "datalist",
          optionsFromActors: true,
          placeholder: "Actor name or free text"
        },
        { key: "frequency", label: "Frequency Measurement", type: "select", options: ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"] }
      ],
      defaultRow: { name: "", formula: "", target: "", owner: "", frequency: "Monthly" },
      emptyMessage:
        "Add KPI rows for reporting. Responsibility suggests Actor names; you can still type any owner. Copy a row when KPIs share the same owner.",
      addRowLabel: "Add KPI"
    }))
  ];

  rerenderAllTableEditors = () => {
    editors.forEach((editor) => editor.render());
  };
}

function wireCrossTabRefresh() {
  let lastWfSteps = JSON.stringify((getState().workflow || []).map((w) => w.step));
  let lastActors = JSON.stringify(getState().actors || []);
  let lastRaciRoles = JSON.stringify(getState().raciConfig?.roles || []);

  subscribe(() => {
    fillFormFromState();
    const s = getState();
    const wfSteps = JSON.stringify((s.workflow || []).map((w) => w.step));
    const actorsJson = JSON.stringify(s.actors || []);
    const raciRolesJson = JSON.stringify(s.raciConfig?.roles || []);
    if (wfSteps !== lastWfSteps) {
      lastWfSteps = wfSteps;
      raciEditorRef.render();
    }
    if (actorsJson !== lastActors) {
      lastActors = actorsJson;
      workflowEditorRef.render();
      kpisEditorRef.render();
      if (slaPartsEditorRef) slaPartsEditorRef.render();
    }
    if (raciRolesJson !== lastRaciRoles) {
      lastRaciRoles = raciRolesJson;
      if (workflowEditorRef) workflowEditorRef.pairedDefaultRow = buildRaciDefaultRow();
      if (raciEditorRef) {
        raciEditorRef.columns = buildRaciColumns();
        raciEditorRef.defaultRow = buildRaciDefaultRow();
        raciEditorRef.render();
      }
    }
  });
}

function wireTopActions() {
  $("#btnTemplate").addEventListener("click", () => {
    const shouldReplace = window.confirm("Load the built-in example and replace your current draft?");
    if (!shouldReplace) return;
    loadEnterpriseExample();
  });

  $("#btnExportHtml").addEventListener("click", () => {
    exportHtml(getState()).catch(() => alert("Could not export HTML. Check that the app is served over http(s) and try again."));
  });
  $("#btnExportMd").addEventListener("click", () => exportMarkdown(getState()));
  $("#btnPrint").addEventListener("click", () => {
    printPdf(getState()).catch(() => alert("Could not open print view. Allow pop-ups and try again."));
  });

  $("#btnSave").addEventListener("click", () => {
    downloadFile(JSON.stringify(getState(), null, 2), "service-card-data.json", "application/json");
  });

  $("#btnLoad").addEventListener("click", () => $("#fileLoader").click());
  $("#fileLoader").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        replaceState(JSON.parse(e.target.result));
        fillFormFromState();
        rerenderAllTableEditors();
      } catch {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  });
}

function init() {
  loadDraft();
  initNavigation();
  initSvcDatePicker();
  fillFormFromState();
  bindIdentityFields();
  bindSlaFields();
  bindSlaKpiActions();
  initEditors();
  wireCrossTabRefresh();
  wireTopActions();
}

init();
