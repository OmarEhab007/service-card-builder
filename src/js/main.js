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
        { key: "frequency", label: "Frequency Measurement" }
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
  initEditors();
  wireCrossTabRefresh();
  wireTopActions();
}

init();
