/**
 * Identity form binding — connects identity form fields to state.
 * Extracted from main.js (B-3).
 */
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import { $ } from "../utils/dom.js";
import { patchState } from "../state/store.js";

let svcDatePicker = null;
let isSyncingFormState = false;

export function initSvcDatePicker() {
  const el = $("#svcDate");
  svcDatePicker = flatpickr(el, {
    dateFormat: "Y-m-d",
    allowInput: true,
    disableMobile: true,
    onChange(_dates, dateStr) {
      if (isSyncingFormState) return;
      patchState((s) => {
        s.identity.date = dateStr;
      });
    }
  });
  el.addEventListener("change", () => {
    if (isSyncingFormState) return;
    patchState((s) => {
      s.identity.date = el.value.trim();
    });
  });
}

export function bindIdentityFields() {
  const map = {
    svcName: ["identity", "name"],
    svcNameAr: ["identity", "nameAr"],
    svcDesc: ["identity", "description"],
    svcDescAr: ["identity", "descriptionAr"],
    svcVersion: ["identity", "version"],
    svcCategory: ["identity", "category"],
    svcStatus: ["identity", "status"],
    svcOwner: ["identity", "owner"],
    svcId: ["identity", "id"],
    svcBusinessPurpose: ["identity", "businessPurpose"],
    svcBusinessOwner: ["identity", "businessOwner"],
    svcTargetRequesters: ["identity", "targetRequesters"],
    svcEligibility: ["identity", "eligibility"],
    svcOutOfScope: ["identity", "outOfScope"],
    svcReviewDate: ["identity", "reviewDate"]
  };

  Object.entries(map).forEach(([id, [scope, key]]) => {
    const input = $("#" + id);
    const sync = () => {
      patchState((state) => {
        state[scope][key] = input.value;
      });
    };
    input.addEventListener("input", sync);
    input.addEventListener("change", sync);
  });
}

/**
 * Sync identity fields from state to DOM, skipping the currently focused element.
 */
export function syncIdentityFields(state, setControlIfNotFocused) {
  setControlIfNotFocused($("#svcName"), state.identity.name || "");
  setControlIfNotFocused($("#svcNameAr"), state.identity.nameAr || "");
  setControlIfNotFocused($("#svcDesc"), state.identity.description || "");
  setControlIfNotFocused($("#svcDescAr"), state.identity.descriptionAr || "");
  setControlIfNotFocused($("#svcVersion"), state.identity.version || "1.0");
  setControlIfNotFocused($("#svcCategory"), state.identity.category || "");
  setControlIfNotFocused($("#svcStatus"), state.identity.status || "");
  setControlIfNotFocused($("#svcOwner"), state.identity.owner || "");
  setControlIfNotFocused($("#svcId"), state.identity.id || "");
  setControlIfNotFocused($("#svcBusinessPurpose"), state.identity.businessPurpose || "");
  setControlIfNotFocused($("#svcBusinessOwner"), state.identity.businessOwner || "");
  setControlIfNotFocused($("#svcTargetRequesters"), state.identity.targetRequesters || "");
  setControlIfNotFocused($("#svcEligibility"), state.identity.eligibility || "");
  setControlIfNotFocused($("#svcOutOfScope"), state.identity.outOfScope || "");
  setControlIfNotFocused($("#svcReviewDate"), state.identity.reviewDate || "");

  const dateVal = state.identity.date || "";
  const dateEl = $("#svcDate");
  if (document.activeElement !== dateEl) {
    isSyncingFormState = true;
    try {
      dateEl.value = dateVal;
      if (svcDatePicker) {
        if (dateVal) {
          svcDatePicker.setDate(dateVal, false, "Y-m-d");
        } else {
          svcDatePicker.clear();
        }
      }
    } finally {
      isSyncingFormState = false;
    }
  }
}
