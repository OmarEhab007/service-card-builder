/**
 * Application entry point — orchestrates initialization and wiring.
 * B-3: Decomposed from 670-line monolith into focused modules:
 *   - bind/identity.js — identity form binding and date picker
 *   - bind/sla.js — SLA/KPI form binding and action buttons
 *   - domain/sla-logic.js — pure SLA/KPI computation functions
 */
import { initNavigation } from "./ui/navigation.js";
import { TableEditor } from "./ui/table-editor.js";
import { $, downloadFile } from "./utils/dom.js";
import { getState, loadDraft, replaceState, subscribe, flushSave } from "./state/store.js";
import { enterpriseTemplate } from "./state/template.js";
import { exportHtml, exportBusinessCardHtml, exportMarkdown, printPdf } from "./export/exporters.js";
import { validateState, getExportWarnings } from "./validation/validator.js";
import { initSvcDatePicker, bindIdentityFields, syncIdentityFields } from "./bind/identity.js";
import { bindSlaFields, bindSlaKpiActions, syncSlaFields } from "./bind/sla.js";
import {
  ACTOR_ROLE_OPTIONS,
  DURATION_OPTIONS,
  KPI_FREQUENCY_OPTIONS,
  WORKFLOW_TYPE_OPTIONS
} from "./domain/form-options.js";

// ── Form ↔ State sync ──────────────────────────────────────────

function setControlIfNotFocused(el, value, attr = "value") {
  if (!el) return;
  if (document.activeElement === el) return;
  if (attr === "value") el.value = value;
  else if (attr === "checked") el.checked = !!value;
  else if (attr === "readOnly") el.readOnly = !!value;
}

function fillFormFromState() {
  const state = getState();
  syncIdentityFields(state, setControlIfNotFocused);
  syncSlaFields(state, setControlIfNotFocused);
}

function loadEnterpriseExample() {
  replaceState(JSON.parse(JSON.stringify(enterpriseTemplate)));
  fillFormFromState();
  rerenderAllTableEditors();
}

// ── Table editors ───────────────────────────────────────────────

/** Table bodies are not re-rendered on every keystroke; refresh after wholesale state replace. */
let rerenderAllTableEditors = () => {};

const editorRefs = { workflow: null, raci: null, kpis: null, slaParts: null };

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
        { key: "role", label: "Role", type: "datalist", options: ACTOR_ROLE_OPTIONS, placeholder: "Pick role or type custom" },
        { key: "department", label: "Department" },
        { key: "email", label: "Email" }
      ],
      defaultRow: { name: "", role: "", department: "", email: "" },
      emptyMessage:
        "List each role or team once. Names you enter here appear as suggestions in Workflow → Actor and SLA/KPIs. Use Copy to duplicate a row.",
      addRowLabel: "Add actor"
    }),
    (editorRefs.workflow = new TableEditor({
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
        { key: "type", label: "Type", type: "select", options: WORKFLOW_TYPE_OPTIONS },
        { key: "duration", label: "Duration", type: "datalist", options: DURATION_OPTIONS, placeholder: "Pick duration or type custom" },
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
      emptyMessage: "Each row is one form field. Use \u201cCopy\u201d on a similar row to duplicate it, then adjust text \u2014 it is faster than starting from scratch.",
      addRowLabel: "Add form field"
    }),
    (editorRefs.raci = new TableEditor({
      mountId: "raciEditor",
      stateKey: "raci",
      structuralEdits: false,
      columns: buildRaciColumns(),
      defaultRow: buildRaciDefaultRow(),
      emptyMessage:
        "Add or reorder steps in the Workflow tab first \u2014 RACI rows are created automatically to match. Then set A/R, R, C, or I per column (use \u201c-\u201d when not applicable).",
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
    (editorRefs.slaParts = new TableEditor({
      mountId: "slaPartsEditor",
      stateKey: "slaParts",
      columns: [
        { key: "part", label: "Part / Phase" },
        {
          key: "team",
          label: "Responsible Team",
          type: "datalist",
          optionsFromActors: true,
          placeholder: "Actor/team name"
        },
        { key: "scope", label: "Scope" },
        { key: "duration", label: "SLA Duration", type: "datalist", options: DURATION_OPTIONS, placeholder: "Pick duration" },
        { key: "target", label: "Target / Commitment" }
      ],
      defaultRow: { part: "", team: "", scope: "", duration: "", target: "" },
      emptyMessage:
        "Split one request into multiple SLA parts. Each row maps to a team with its own SLA duration and target.",
      addRowLabel: "Add SLA part"
    })),
    (editorRefs.kpis = new TableEditor({
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
        { key: "frequency", label: "Frequency Measurement", type: "select", options: KPI_FREQUENCY_OPTIONS }
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

// ── Cross-tab refresh ───────────────────────────────────────────

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
      editorRefs.raci.render();
    }
    if (actorsJson !== lastActors) {
      lastActors = actorsJson;
      editorRefs.workflow.render();
      editorRefs.kpis.render();
      if (editorRefs.slaParts) editorRefs.slaParts.render();
    }
    if (raciRolesJson !== lastRaciRoles) {
      lastRaciRoles = raciRolesJson;
      if (editorRefs.workflow) editorRefs.workflow.pairedDefaultRow = buildRaciDefaultRow();
      if (editorRefs.raci) {
        editorRefs.raci.columns = buildRaciColumns();
        editorRefs.raci.defaultRow = buildRaciDefaultRow();
        editorRefs.raci.render();
      }
    }
  });
}

// ── Toolbar actions ─────────────────────────────────────────────

/** Set a button to loading state while an async action runs, then restore it. */
async function withLoadingButton(btn, action) {
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = `${originalText}\u2026`;
  try {
    await action();
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

/** Confirm export if card has warnings. Returns true to proceed, false to abort. */
function confirmExportWarnings() {
  const warnings = getExportWarnings(getState());
  if (warnings.length === 0) return true;
  return window.confirm(
    `The service card has incomplete fields:\n\n\u2022 ${warnings.join("\n\u2022 ")}\n\nExport anyway?`
  );
}

/** Returns the currently selected export type: "business" or "full". */
function getExportType() {
  const active = document.querySelector(".export-type-btn--active");
  return active ? active.dataset.type : "business";
}

function wireTopActions() {
  // Export type toggle
  document.querySelectorAll(".export-type-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".export-type-btn").forEach((b) => {
        b.classList.remove("export-type-btn--active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("export-type-btn--active");
      btn.setAttribute("aria-pressed", "true");
    });
  });

  $("#btnTemplate").addEventListener("click", () => {
    const shouldReplace = window.confirm("Load the built-in example and replace your current draft?");
    if (!shouldReplace) return;
    loadEnterpriseExample();
  });

  const btnExportHtml = $("#btnExportHtml");
  btnExportHtml.addEventListener("click", () => {
    if (!confirmExportWarnings()) return;
    const type = getExportType();
    const exportFn = type === "business" ? exportBusinessCardHtml : exportHtml;
    withLoadingButton(btnExportHtml, () =>
      exportFn(getState()).catch(() => alert("Could not export HTML. Check that the app is served over http(s) and try again."))
    );
  });

  $("#btnExportMd").addEventListener("click", () => {
    if (!confirmExportWarnings()) return;
    exportMarkdown(getState());
  });

  const btnPrint = $("#btnPrint");
  btnPrint.addEventListener("click", () => {
    if (!confirmExportWarnings()) return;
    const type = getExportType();
    withLoadingButton(btnPrint, () =>
      printPdf(getState(), type).catch(() => alert("Could not open print view. Allow pop-ups and try again."))
    );
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
        const parsed = JSON.parse(e.target.result);
        const { ok, errors } = validateState(parsed);
        if (!ok) {
          const proceed = window.confirm(
            `The loaded file has validation issues:\n\n\u2022 ${errors.slice(0, 8).join("\n\u2022 ")}${errors.length > 8 ? `\n\u2022 \u2026and ${errors.length - 8} more` : ""}\n\nLoad it anyway? (Data may be incomplete)`
          );
          if (!proceed) return;
        }
        replaceState(parsed);
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

// ── Bootstrap ───────────────────────────────────────────────────

function init() {
  loadDraft();
  initNavigation();
  initSvcDatePicker();
  fillFormFromState();
  bindIdentityFields();
  bindSlaFields(fillFormFromState);
  initEditors();
  bindSlaKpiActions(fillFormFromState, editorRefs);
  wireCrossTabRefresh();
  wireTopActions();

  // Flush any pending debounced save before the page unloads
  window.addEventListener("beforeunload", () => flushSave());
}

init();
