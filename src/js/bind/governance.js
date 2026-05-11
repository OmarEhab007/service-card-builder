import { patchState, getState, subscribe } from "../state/store.js";
import { computeReadiness } from "../domain/readiness.js";

function el(id) {
  return document.getElementById(id);
}

const TEXT_FIELDS = ["preparedBy", "reviewedBy", "approvedBy", "approvalDate", "publicationNotes"];
const BOOL_FIELDS = ["uatCompleted", "businessOwnerSignedOff", "itilAligned"];

export function bindGovernanceFields() {
  TEXT_FIELDS.forEach((key) => {
    const input = el(`gov_${key}`);
    if (!input) return;
    const sync = () => patchState((s) => { s.governance[key] = input.value; });
    input.addEventListener("input", sync);
    input.addEventListener("change", sync);
  });

  BOOL_FIELDS.forEach((key) => {
    const input = el(`gov_${key}`);
    if (!input) return;
    input.addEventListener("change", () => {
      patchState((s) => { s.governance[key] = input.checked; });
    });
  });
}

export function syncGovernanceFields(state) {
  const gov = state.governance || {};
  TEXT_FIELDS.forEach((key) => {
    const input = el(`gov_${key}`);
    if (input && document.activeElement !== input) input.value = gov[key] || "";
  });
  BOOL_FIELDS.forEach((key) => {
    const input = el(`gov_${key}`);
    if (input) input.checked = !!gov[key];
  });
}

/** Render the live readiness panel in the Readiness tab. */
export function renderReadinessPanel(state) {
  const container = el("readinessPanel");
  if (!container) return;

  const r = computeReadiness(state);

  const sections = [
    { key: "business", title: "Business Readiness" },
    { key: "technical", title: "Technical Readiness" },
    { key: "governance", title: "Governance Checklist" },
    { key: "uat", title: "UAT Checklist" },
    { key: "publication", title: "Publication Readiness" }
  ];

  const scoreHtml = sections
    .map(({ key, title }) => {
      const { passed, total } = r[key];
      const pct = total === 0 ? 100 : Math.round((passed / total) * 100);
      const cls = pct === 100 ? "score-badge--ok" : pct >= 60 ? "score-badge--warn" : "score-badge--fail";
      return `<div class="score-badge ${cls}"><span class="score-badge__label">${title}</span><span class="score-badge__value">${passed}/${total}</span></div>`;
    })
    .join("");

  const listHtml = sections
    .map(({ key, title }) => {
      const { items } = r[key];
      const rows = items
        .map((item) => {
          const cls = item.ok ? "checklist-item--ok" : item.critical ? "checklist-item--fail" : "checklist-item--warn";
          const icon = item.ok ? "✓" : item.critical ? "✗" : "○";
          return `<li class="checklist-item ${cls}"><span class="checklist-icon">${icon}</span>${item.label}</li>`;
        })
        .join("");
      const { passed, total } = r[key];
      return `<details class="readiness-section" ${passed === total ? "" : "open"}><summary class="readiness-section__title">${title} <span class="readiness-section__score">${passed}/${total}</span></summary><ul class="checklist">${rows}</ul></details>`;
    })
    .join("");

  container.innerHTML = `<div class="readiness-scores">${scoreHtml}</div>${listHtml}`;
}

/** Wire subscribe to keep readiness panel in sync. */
export function initReadinessPanel() {
  renderReadinessPanel(getState());
  subscribe(() => {
    if (document.querySelector('[data-panel="readiness"]')?.classList.contains("active")) {
      renderReadinessPanel(getState());
    }
  });
}
