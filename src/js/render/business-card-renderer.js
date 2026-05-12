import { esc } from "../utils/dom.js";
import { buildCardStyles } from "./card-styles.js";

const FONT_STACK = '"Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';
const FONT_AR_STACK = '"Loew Next Arabic", "Segoe UI", "Arabic UI Text", Tahoma, sans-serif';

function normalizeAssetBase(assetBase) {
  if (assetBase === null || typeof assetBase === "undefined" || assetBase === "") return "/";
  const s = String(assetBase);
  return s.endsWith("/") ? s : `${s}/`;
}

function journeyFromWorkflow(workflow) {
  if (!workflow || workflow.length === 0) return null;

  const steps = [];
  const decisionSteps = workflow.filter((w) => String(w.type || "").toLowerCase() === "decision");
  const actionSteps = workflow.filter((w) => String(w.type || "").toLowerCase() !== "decision");

  if (actionSteps.length === 0 && decisionSteps.length === 0) return null;

  steps.push("Submit the request.");

  if (decisionSteps.length > 0) {
    const approvers = [...new Set(decisionSteps.map((w) => w.actor).filter(Boolean))];
    if (approvers.length > 0) {
      steps.push(`Required approvals are completed by: ${approvers.join(", ")}.`);
    } else {
      steps.push("Required approvals are completed.");
    }
  }

  const fulfillmentActors = [...new Set(actionSteps.map((w) => w.actor).filter(Boolean))];
  if (fulfillmentActors.length > 0) {
    steps.push(`The service is fulfilled by: ${fulfillmentActors.join(", ")}.`);
  } else {
    steps.push("The responsible team fulfills the request.");
  }

  steps.push("The requester is notified when the request is completed.");

  return steps;
}

function approvalSummaryFromState(state) {
  const f = state.fulfillment || {};
  const workflow = state.workflow || [];
  const decisions = workflow.filter((w) => String(w.type || "").toLowerCase() === "decision");

  const lines = [];

  if (f.managerApproval) lines.push("Manager approval is required.");
  if (f.businessApproval) lines.push("Business owner approval is required.");
  if (f.architectureApproval) lines.push("Architecture review is required.");
  if (f.securityReview) lines.push("Security review is required.");

  if (lines.length === 0 && decisions.length > 0) {
    const actors = [...new Set(decisions.map((w) => w.actor).filter(Boolean))];
    if (actors.length > 0) {
      lines.push(`Approval is required from: ${actors.join(", ")}.`);
    } else {
      lines.push(`${decisions.length} approval step(s) are required.`);
    }
  }

  if (lines.length === 0) lines.push("No formal approvals configured.");

  return lines;
}

function businessCardStyles(opts) {
  const base = buildCardStyles({
    fontStack: FONT_STACK,
    fontArStack: FONT_AR_STACK,
    bgUrl: opts.embeddedBackgroundDataUri || `${normalizeAssetBase(opts.assetBase)}Background.svg`,
    visualsUrl: opts.embeddedVisualsDataUri || `${normalizeAssetBase(opts.assetBase)}Visuals.svg`,
    brand: {
      primary: "#1e40af",
      primaryDark: "#1e3a8a",
      surface: "#f1f5f9",
      ink: "#0f172a",
      muted: "#64748b",
      border: "#e2e8f0",
      accent: "#2563eb"
    }
  });

  return (
    base +
    `
    .bc-badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: .75rem; font-weight: 600; background: #dbeafe; color: #1e3a8a; margin-bottom: 12px; }
    .bc-section { margin-bottom: 2rem; }
    .bc-section h2 { font-size: 1.05rem; font-weight: 700; color: #1e40af; border-bottom: 2px solid #e2e8f0; padding-bottom: .35rem; margin-bottom: 1rem; }
    .bc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: .75rem; }
    .bc-item dt { font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: #64748b; margin-bottom: 2px; }
    .bc-item dd { font-size: .9rem; color: #0f172a; margin: 0; }
    .bc-prose { font-size: .9rem; color: #0f172a; line-height: 1.6; }
    .bc-prose + .bc-prose { margin-top: .75rem; }
    .bc-journey ol { margin: 0; padding-left: 1.4rem; }
    .bc-journey li { padding: .4rem 0; font-size: .9rem; color: #0f172a; }
    .bc-approval-list { list-style: none; margin: 0; padding: 0; }
    .bc-approval-list li { padding: .3rem 0; font-size: .9rem; color: #0f172a; display: flex; align-items: center; gap: .5rem; }
    .bc-approval-list li::before { content: "✓"; color: #2563eb; font-weight: 700; }
    .bc-kpi-table { width: 100%; border-collapse: collapse; font-size: .85rem; }
    .bc-kpi-table th { background: #f1f5f9; padding: .5rem .75rem; text-align: left; font-weight: 600; color: #1e3a8a; border: 1px solid #e2e8f0; }
    .bc-kpi-table td { padding: .45rem .75rem; border: 1px solid #e2e8f0; color: #0f172a; vertical-align: top; }
    .bc-kpi-table tr:nth-child(even) td { background: #f8fafc; }
    .bc-stamp { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: .75rem; margin-top: 1rem; }
    .bc-stamp-cell { border: 1px solid #e2e8f0; border-radius: 6px; padding: .6rem .75rem; }
    .bc-stamp-cell dt { font-size: .68rem; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: #64748b; }
    .bc-stamp-cell dd { margin: 0; font-size: .85rem; color: #0f172a; min-height: 1.4rem; border-top: 1px solid #e2e8f0; margin-top: .4rem; padding-top: .3rem; }
    .bc-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem 1.25rem; }
  `
  );
}

export function renderBusinessCard(state, opts = {}) {
  const id = state.identity || {};
  const sla = state.sla || {};
  const support = state.support || [];
  const kpis = state.kpis || [];
  const workflow = state.workflow || [];
  const fields = state.fields || [];
  const gov = state.governance || {};

  const root = normalizeAssetBase(opts.assetBase);
  const styles = businessCardStyles(opts);

  const status = id.status || "";
  const statusToneClass = status && !status.toLowerCase().includes("active") ? " status-pill--neutral" : "";

  const journeySteps = journeyFromWorkflow(workflow);
  const approvalLines = approvalSummaryFromState(state);

  const supportGroup = sla.supportGroup || support.map((r) => r.supportGroup).filter(Boolean).join(", ") || "-";
  const escalation = [sla.notif1Who, sla.notif2Who].filter(Boolean).join("; ") || "-";

  const ownershipRows = [
    { label: "Service Owner", value: id.owner || "-" },
    { label: "Business Owner", value: id.businessOwner || "-" },
    { label: "Prepared By", value: gov.preparedBy || "-" },
    { label: "Reviewed By", value: gov.reviewedBy || "-" },
    { label: "Approved By", value: gov.approvedBy || "-" },
    { label: "Approval Date", value: gov.approvalDate || "-" },
    { label: "Version", value: id.version || "1.0" },
    { label: "Effective Date", value: id.date || "-" },
    { label: "Review Date", value: id.reviewDate || "-" }
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(id.name || "Business Service Card")}</title>
  ${opts.embeddedFontCss ? `<style>${opts.embeddedFontCss}</style>` : `<link rel="stylesheet" href="${root}fonts/loew-face.css">`}
  <style>${styles}</style>
</head>
<body>
  <div class="doc">
    <header class="hdr">
      <div class="hdr-banner">
        <div class="hdr-banner-inner">
          <div class="hdr-banner-main">
            <div>
              <p class="hdr-kicker">Business Service Card</p>
              <h1 class="hdr-banner-title">${esc(id.name || "Service Card")}</h1>
              <p class="hdr-banner-subtitle">${esc(id.category || "Service documentation")}</p>
            </div>
          </div>
          ${status ? `<span class="status-pill status-pill--on-dark${statusToneClass}">${esc(status)}</span>` : ""}
        </div>
      </div>
      ${id.nameAr ? `<div class="hdr-ar"><p class="title-ar" dir="rtl">${esc(id.nameAr)}</p></div>` : ""}
      <dl class="meta-grid">
        <div class="meta-item"><dt>Service ID</dt><dd>${esc(id.id || "-")}</dd></div>
        <div class="meta-item"><dt>Version</dt><dd>${esc(id.version || "1.0")}</dd></div>
        <div class="meta-item"><dt>Category</dt><dd>${esc(id.category || "-")}</dd></div>
        <div class="meta-item"><dt>Service Owner</dt><dd>${esc(id.owner || "-")}</dd></div>
        <div class="meta-item"><dt>Business Owner</dt><dd>${esc(id.businessOwner || "-")}</dd></div>
        <div class="meta-item"><dt>Effective Date</dt><dd>${esc(id.date || "-")}</dd></div>
        <div class="meta-item"><dt>Review Date</dt><dd>${esc(id.reviewDate || "-")}</dd></div>
      </dl>
    </header>

    <section class="bc-section">
      <h2>Business Description</h2>
      <div class="bc-card">
        <p class="bc-prose">${esc(id.description || "No description provided.").replace(/\n/g, "<br>")}</p>
        ${id.descriptionAr ? `<p class="bc-prose" dir="rtl">${esc(id.descriptionAr).replace(/\n/g, "<br>")}</p>` : ""}
        ${id.businessPurpose ? `<hr style="border:none;border-top:1px solid #e2e8f0;margin:.75rem 0"><p class="bc-prose"><strong>Business Purpose & Value:</strong> ${esc(id.businessPurpose).replace(/\n/g, "<br>")}</p>` : ""}
        ${id.outOfScope ? `<p class="bc-prose"><strong>Out of Scope:</strong> ${esc(id.outOfScope).replace(/\n/g, "<br>")}</p>` : ""}
      </div>
    </section>

    <section class="bc-section">
      <h2>Request Eligibility</h2>
      <div class="bc-card">
        <dl class="bc-grid">
          <div class="bc-item"><dt>Who Can Request</dt><dd>${esc(id.targetRequesters || sla.requester || "-")}</dd></div>
          ${id.eligibility ? `<div class="bc-item"><dt>Eligibility Requirements</dt><dd>${esc(id.eligibility)}</dd></div>` : ""}
        </dl>
      </div>
    </section>

    ${
      fields.length > 0
        ? `<section class="bc-section">
      <h2>Requester Information Required</h2>
      <div class="bc-card">
        <table class="bc-kpi-table">
          <thead><tr><th>Information Needed</th><th>Required</th><th>Notes</th></tr></thead>
          <tbody>
            ${fields.map((f) => `<tr><td>${esc(f.nameEn)}</td><td>${f.mandatory === "X" ? "Required" : "Optional"}</td><td>${f.dependency && f.dependency !== "-" ? esc(f.dependency) : ""}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    </section>`
        : ""
    }

    ${
      journeySteps
        ? `<section class="bc-section bc-journey">
      <h2>Request Journey</h2>
      <div class="bc-card">
        <ol>${journeySteps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
      </div>
    </section>`
        : ""
    }

    <section class="bc-section">
      <h2>Approval Summary</h2>
      <div class="bc-card">
        <ul class="bc-approval-list">
          ${approvalLines.map((l) => `<li>${esc(l)}</li>`).join("")}
        </ul>
      </div>
    </section>

    <section class="bc-section">
      <h2>Fulfillment Commitment</h2>
      <div class="bc-card">
        <dl class="bc-grid">
          <div class="bc-item"><dt>Expected Delivery Time</dt><dd>${esc(sla.duration || "-")}</dd></div>
          ${sla.prerequisites && sla.prerequisites !== "-" ? `<div class="bc-item"><dt>Prerequisites</dt><dd>${esc(sla.prerequisites)}</dd></div>` : ""}
        </dl>
      </div>
    </section>

    <section class="bc-section">
      <h2>Support &amp; Escalation</h2>
      <div class="bc-card">
        <dl class="bc-grid">
          <div class="bc-item"><dt>Support Group</dt><dd>${esc(supportGroup)}</dd></div>
          ${escalation !== "-" ? `<div class="bc-item"><dt>Escalation Contact</dt><dd>${esc(escalation)}</dd></div>` : ""}
        </dl>
      </div>
    </section>

    ${
      kpis.length > 0
        ? `<section class="bc-section">
      <h2>Service Quality Measures</h2>
      <div class="bc-card">
        <table class="bc-kpi-table">
          <thead><tr><th>Measure</th><th>Target</th><th>Responsible</th><th>Frequency</th></tr></thead>
          <tbody>
            ${kpis.map((k) => `<tr><td>${esc(k.name)}</td><td>${esc(k.target)}</td><td>${esc(k.owner)}</td><td>${esc(k.frequency)}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    </section>`
        : ""
    }

    <section class="bc-section">
      <h2>Ownership &amp; Review</h2>
      <div class="bc-stamp">
        ${ownershipRows.map((r) => `<div class="bc-stamp-cell"><dt>${esc(r.label)}</dt><dd>${esc(r.value)}</dd></div>`).join("")}
      </div>
    </section>

    <footer class="ft">Business Service Card &middot; ${esc(id.name || "Service Card")} &middot; v${esc(id.version || "1.0")}</footer>
  </div>
</body>
</html>`;
}
