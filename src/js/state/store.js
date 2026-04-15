import { FULFILLMENT_DEFAULT, normalizeFulfillmentConfig } from "./fulfillment.js";

const listeners = new Set();

const DEFAULT_RACI_ROLES = [
  { key: "requester", label: "Requester" },
  { key: "businessOwner", label: "Business Owner" },
  { key: "requesterManager", label: "Requester Manager" },
  { key: "deliveryTeams", label: "System / Network / DB / EA" }
];

function slugifyRole(label, idx) {
  const base = String(label || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join("");
  return base || `role${idx + 1}`;
}

function getRaciRoles(next) {
  const actorRoles = Array.isArray(next?.actors)
    ? [...new Set(next.actors.map((a) => String(a?.name || "").trim()).filter(Boolean))]
    : [];
  if (actorRoles.length) {
    return actorRoles.map((label, idx) => ({ key: slugifyRole(label, idx), label }));
  }
  const roles = next?.raciConfig?.roles;
  if (!Array.isArray(roles) || roles.length === 0) return DEFAULT_RACI_ROLES;
  return roles
    .map((r) => ({ key: String(r?.key || "").trim(), label: String(r?.label || "").trim() }))
    .filter((r) => r.key && r.label);
}

/**
 * Keeps derived data consistent: RACI rows align to workflow steps; optional SLA service mirrors Identity name.
 */
export function reconcileState(next) {
  const roles = getRaciRoles(next);
  if (!next.raciConfig || typeof next.raciConfig !== "object") next.raciConfig = {};
  next.raciConfig.roles = roles;

  const wf = Array.isArray(next.workflow) ? next.workflow : [];
  if (!Array.isArray(next.raci)) next.raci = [];
  while (next.raci.length < wf.length) {
    const row = { step: "" };
    roles.forEach((role) => {
      row[role.key] = "-";
    });
    next.raci.push(row);
  }
  while (next.raci.length > wf.length) {
    next.raci.pop();
  }
  for (let i = 0; i < wf.length; i++) {
    const stepText = (wf[i] && wf[i].step) || "";
    if (!next.raci[i]) {
      next.raci[i] = { step: "" };
    }
    roles.forEach((role) => {
      if (!next.raci[i][role.key]) next.raci[i][role.key] = "-";
    });
    next.raci[i].step = stepText;
  }

  if (!next.sla || typeof next.sla !== "object") next.sla = {};
  if (next.sla.mirrorServiceName === undefined) next.sla.mirrorServiceName = true;
  if (next.sla.mirrorServiceName) {
    next.sla.service = (next.identity && next.identity.name) || "";
  }
  return next;
}

function normalizeStateShape(next) {
  next.fulfillment = normalizeFulfillmentConfig(next.fulfillment || FULFILLMENT_DEFAULT);
  if (!next.raciConfig || typeof next.raciConfig !== "object") {
    next.raciConfig = { roles: DEFAULT_RACI_ROLES };
  }
  if (!Array.isArray(next.raciConfig.roles) || next.raciConfig.roles.length === 0) {
    next.raciConfig.roles = DEFAULT_RACI_ROLES;
  }
  if (!next.identity) next.identity = { ...state.identity };
  if (!Array.isArray(next.actors)) next.actors = [];
  if (!Array.isArray(next.workflow)) next.workflow = [];
  if (!Array.isArray(next.fields)) next.fields = [];
  if (!Array.isArray(next.raci)) next.raci = [];
  if (!Array.isArray(next.support)) next.support = [];
  if (!Array.isArray(next.slaParts)) next.slaParts = [];
  if (!Array.isArray(next.kpis)) next.kpis = [];
  if (!next.sla || typeof next.sla !== "object") next.sla = {};
  const svc = next.sla.service || "";
  const idName = (next.identity && next.identity.name) || "";
  let mirror = next.sla.mirrorServiceName;
  if (mirror === undefined) {
    mirror = svc === idName || svc === "";
  }
  next.sla = {
    service: svc,
    requester: next.sla.requester || "",
    prerequisites: next.sla.prerequisites || "",
    supportGroup: next.sla.supportGroup || "",
    controls: next.sla.controls || "",
    duration: next.sla.duration || "5BD",
    notif1Who: next.sla.notif1Who || "",
    notif1When: next.sla.notif1When || "",
    notif2Who: next.sla.notif2Who || "",
    notif2When: next.sla.notif2When || "",
    mirrorServiceName: mirror !== false
  };
  reconcileState(next);
  return next;
}

const state = {
  schemaVersion: "1.0.0",
  fulfillment: { ...FULFILLMENT_DEFAULT },
  raciConfig: { roles: DEFAULT_RACI_ROLES },
  identity: {
    name: "",
    nameAr: "",
    description: "",
    descriptionAr: "",
    version: "1.0",
    category: "Infrastructure",
    status: "Active",
    owner: "",
    date: "",
    id: ""
  },
  actors: [],
  workflow: [],
  fields: [],
  raci: [],
  support: [],
  slaParts: [],
  sla: {
    service: "Server Request",
    requester: "",
    prerequisites: "-",
    supportGroup: "",
    controls: "",
    duration: "5BD",
    notif1Who: "",
    notif1When: "75%",
    notif2Who: "",
    notif2When: "90%",
    mirrorServiceName: true
  },
  kpis: []
};

export function getState() {
  return state;
}

export function patchState(patcher) {
  patcher(state);
  reconcileState(state);
  listeners.forEach((listener) => listener(state));
  localStorage.setItem("scb-draft", JSON.stringify(state));
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function loadDraft() {
  const draft = localStorage.getItem("scb-draft");
  if (!draft) return;
  try {
    const parsed = normalizeStateShape(JSON.parse(draft));
    Object.assign(state, parsed);
  } catch {
    localStorage.removeItem("scb-draft");
  }
}

export function replaceState(nextState) {
  normalizeStateShape(nextState);
  Object.keys(state).forEach((key) => delete state[key]);
  Object.assign(state, nextState);
  listeners.forEach((listener) => listener(state));
  localStorage.setItem("scb-draft", JSON.stringify(state));
}
