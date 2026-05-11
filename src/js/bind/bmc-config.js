import { patchState } from "../state/store.js";

const DWP_FIELDS = ["catalogProfile", "questionnaireMapping", "workflowMapping", "processInputs", "connectorProvider", "entitlementRules", "publishLifecycle"];
const SRM_FIELDS = ["srdName", "srdType", "requestCatalogManager", "aotMapping", "pdtMapping", "fulfillmentObject", "approvalRules", "slmServiceTarget", "businessServiceCI", "deploymentLifecycle"];

function el(id) {
  return document.getElementById(id);
}

function showHideSections(mode) {
  const dwpSection = el("bmcDwpSection");
  const srmSection = el("bmcSrmSection");
  if (!dwpSection || !srmSection) return;
  const showDwp = mode === "dwp" || mode === "hybrid";
  const showSrm = mode === "srm" || mode === "hybrid";
  dwpSection.hidden = !showDwp;
  srmSection.hidden = !showSrm;
}

export function bindBmcConfigFields() {
  const modeRadios = document.querySelectorAll('input[name="bmcImplementationMode"]');
  modeRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (!radio.checked) return;
      patchState((s) => { s.bmcConfig.implementationMode = radio.value; });
      showHideSections(radio.value);
    });
  });

  DWP_FIELDS.forEach((key) => {
    const input = el(`bmcDwp_${key}`);
    if (!input) return;
    const sync = () => patchState((s) => { s.bmcConfig.dwp[key] = input.value; });
    input.addEventListener("input", sync);
    input.addEventListener("change", sync);
  });

  SRM_FIELDS.forEach((key) => {
    const input = el(`bmcSrm_${key}`);
    if (!input) return;
    const sync = () => patchState((s) => { s.bmcConfig.srm[key] = input.value; });
    input.addEventListener("input", sync);
    input.addEventListener("change", sync);
  });

  ["deploymentChecklist", "localizationNotes"].forEach((key) => {
    const input = el(`bmc_${key}`);
    if (!input) return;
    const sync = () => patchState((s) => { s.bmcConfig[key] = input.value; });
    input.addEventListener("input", sync);
    input.addEventListener("change", sync);
  });
}

export function syncBmcConfigFields(state) {
  const bmc = state.bmcConfig || {};
  const mode = bmc.implementationMode || "none";

  const modeRadios = document.querySelectorAll('input[name="bmcImplementationMode"]');
  modeRadios.forEach((r) => { r.checked = r.value === mode; });
  showHideSections(mode);

  const dwp = bmc.dwp || {};
  DWP_FIELDS.forEach((key) => {
    const input = el(`bmcDwp_${key}`);
    if (input && document.activeElement !== input) input.value = dwp[key] || "";
  });

  const srm = bmc.srm || {};
  SRM_FIELDS.forEach((key) => {
    const input = el(`bmcSrm_${key}`);
    if (input && document.activeElement !== input) input.value = srm[key] || "";
  });

  ["deploymentChecklist", "localizationNotes"].forEach((key) => {
    const input = el(`bmc_${key}`);
    if (input && document.activeElement !== input) input.value = bmc[key] || "";
  });
}
