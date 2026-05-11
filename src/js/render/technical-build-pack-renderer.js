import { esc } from "../utils/dom.js";
import { buildCardStyles } from "./card-styles.js";
import { getActorPalette, uniqueWorkflowActors, outcomeTone } from "./actor-colors.js";

const FONT_STACK = '"Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';
const FONT_AR_STACK = '"Loew Next Arabic", "Segoe UI", "Arabic UI Text", Tahoma, sans-serif';

const MODE_LABELS = { dwp: "DWP Catalog", srm: "SRM / SRD", hybrid: "Hybrid (DWP + SRM)", none: "Not specified" };

function normalizeAssetBase(assetBase) {
  if (assetBase === null || typeof assetBase === "undefined" || assetBase === "") return "/";
  const s = String(assetBase);
  return s.endsWith("/") ? s : `${s}/`;
}

function tbpStyles(opts) {
  const root = normalizeAssetBase(opts.assetBase);
  const bgUrl = opts.embeddedBackgroundDataUri || `${root}Background.svg`;
  const visualsUrl = opts.embeddedVisualsDataUri || `${root}Visuals.svg`;
  const brand = { primary: "#1e3a8a", primaryDark: "#172554", surface: "#f1f5f9", ink: "#0f172a", muted: "#64748b", border: "#e2e8f0", accent: "#2563eb" };
  const base = buildCardStyles({ fontStack: FONT_STACK, fontArStack: FONT_AR_STACK, bgUrl, visualsUrl, brand });
  return (
    base +
    `
    .tbp-badge { display:inline-block;padding:2px 10px;border-radius:999px;font-size:.72rem;font-weight:700;background:#172554;color:#bfdbfe;letter-spacing:.04em;margin-bottom:12px; }
    .tbp-sec { margin-bottom:2rem; }
    .tbp-sec h2 { font-size:1rem;font-weight:700;color:#1e3a8a;border-bottom:2px solid #e2e8f0;padding-bottom:.3rem;margin-bottom:.85rem; }
    .tbp-sec h3 { font-size:.85rem;font-weight:700;color:#1e40af;margin:.85rem 0 .4rem; }
    .tbp-grid { display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.65rem; }
    .tbp-item dt { font-size:.67rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#64748b;margin-bottom:1px; }
    .tbp-item dd { font-size:.85rem;color:#0f172a;margin:0; }
    .tbp-card { background:#fff;border:1px solid #e2e8f0;border-radius:7px;padding:.85rem 1rem;margin-bottom:.75rem; }
    .tbp-card--mode { background:#eff6ff;border-color:#bfdbfe; }
    .tbp-mode-label { font-size:1.05rem;font-weight:700;color:#1e3a8a; }
    .tbp-field { font-size:.82rem;color:#0f172a;line-height:1.5; }
    .tbp-field strong { color:#334155; }
    .tbp-tbl { width:100%;border-collapse:collapse;font-size:.8rem; }
    .tbp-tbl th { background:#f1f5f9;padding:.4rem .65rem;text-align:left;font-weight:600;color:#1e3a8a;border:1px solid #e2e8f0; }
    .tbp-tbl td { padding:.38rem .65rem;border:1px solid #e2e8f0;color:#0f172a;vertical-align:top; }
    .tbp-tbl tr:nth-child(even) td { background:#f8fafc; }
    .tbp-empty { color:#94a3b8;font-style:italic;font-size:.8rem; }
    .tbp-tag { display:inline-block;padding:1px 7px;border-radius:4px;font-size:.72rem;font-weight:600;background:#dbeafe;color:#1e40af;margin-right:4px; }
    `
  );
}

function fieldRow(label, value) {
  if (!value || String(value).trim() === "") return "";
  return `<div class="tbp-item"><dt>${esc(label)}</dt><dd>${esc(value).replace(/\n/g, "<br>")}</dd></div>`;
}

function textBlock(label, value) {
  if (!value || String(value).trim() === "") return "";
  return `<div style="margin-bottom:.5rem"><strong style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#64748b">${esc(label)}</strong><p class="tbp-field" style="margin:.25rem 0 0">${esc(value).replace(/\n/g, "<br>")}</p></div>`;
}

function dwpSection(dwp) {
  if (!dwp) return "";
  const rows = [
    textBlock("Catalog Profile", dwp.catalogProfile),
    textBlock("Questionnaire Mapping", dwp.questionnaireMapping),
    textBlock("Workflow / Process Inputs", dwp.workflowMapping),
    textBlock("Process Input Variables", dwp.processInputs),
    textBlock("Connector / Provider Notes", dwp.connectorProvider),
    textBlock("Entitlement Rules", dwp.entitlementRules),
    textBlock("Approval & Publish Lifecycle", dwp.publishLifecycle)
  ].filter(Boolean);
  if (rows.length === 0) return `<p class="tbp-empty">No DWP Catalog configuration entered.</p>`;
  return `<div class="tbp-card">${rows.join("")}</div>`;
}

function srmSection(srm) {
  if (!srm) return "";
  const meta = [
    fieldRow("SRD Name", srm.srdName),
    fieldRow("SRD Type", srm.srdType),
    fieldRow("Request Catalog Manager", srm.requestCatalogManager),
    fieldRow("Fulfillment Object", srm.fulfillmentObject),
    fieldRow("Business Service CI", srm.businessServiceCI)
  ].filter(Boolean);
  const blocks = [
    textBlock("AOT Mapping", srm.aotMapping),
    textBlock("PDT Mapping", srm.pdtMapping),
    textBlock("Approval Rules", srm.approvalRules),
    textBlock("SLM / Service Target Mapping", srm.slmServiceTarget),
    textBlock("Deployment Lifecycle", srm.deploymentLifecycle)
  ].filter(Boolean);
  if (meta.length === 0 && blocks.length === 0) return `<p class="tbp-empty">No SRM/SRD configuration entered.</p>`;
  return `<div class="tbp-card">
    ${meta.length > 0 ? `<div class="tbp-grid" style="margin-bottom:.75rem">${meta.join("")}</div>` : ""}
    ${blocks.join("")}
  </div>`;
}

export function renderTechnicalBuildPack(state, opts = {}) {
  const id = state.identity || {};
  const bmc = state.bmcConfig || {};
  const actors = state.actors || [];
  const workflow = state.workflow || [];
  const fields = state.fields || [];
  const raci = state.raci || [];
  const raciRoles = Array.isArray(state.raciConfig?.roles) ? state.raciConfig.roles : [];
  const support = state.support || [];
  const sla = state.sla || {};
  const slaParts = state.slaParts || [];
  const kpis = state.kpis || [];

  const root = normalizeAssetBase(opts.assetBase);
  const mode = bmc.implementationMode || "none";
  const modeLabel = MODE_LABELS[mode] || mode;
  const showDwp = mode === "dwp" || mode === "hybrid";
  const showSrm = mode === "srm" || mode === "hybrid";

  const legendItems = uniqueWorkflowActors(workflow);
  const legendHtml = legendItems.length === 0 ? "" : `<div class="workflow-legend">
    <div class="workflow-legend-title">Team roles</div>
    <div class="workflow-legend-chips">
      ${legendItems.map((label) => { const { solid } = getActorPalette(label); return `<span class="legend-chip" style="--sw:${solid}"><span class="legend-swatch"></span>${esc(label)}</span>`; }).join("")}
    </div>
  </div>`;

  const workflowRows = workflow.length === 0
    ? "<tr><td colspan='5' class='empty'>No workflow steps defined.</td></tr>"
    : workflow.map((w, i) => {
        const { solid, light } = getActorPalette(w.actor);
        const ot = outcomeTone(w.type);
        const cond = w.condition && String(w.condition).trim() && String(w.condition).trim() !== "-";
        return `<tr style="--row-solid:${solid};--row-light:${light}">
          <td class="wf-num"><span class="step-disc">${i + 1}</span></td>
          <td class="wf-actor">${esc(w.actor)}</td>
          <td class="wf-action">${esc(w.step)}</td>
          <td class="wf-meta"><span class="type-chip">${esc(w.type)}</span><div class="wf-sub">${esc(w.duration)}</div>${cond ? `<div class="wf-sub">${esc(w.condition)}</div>` : ""}</td>
          <td class="wf-out"><span class="outcome-pill ${ot.class}">${esc(ot.label)}</span></td>
        </tr>`;
      }).join("");

  const styles = tbpStyles(opts);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>BMC Build Pack — ${esc(id.name || "Service")}</title>
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
            <p class="hdr-kicker">Technical BMC Build Pack</p>
            <h1 class="hdr-banner-title">${esc(id.name || "Service")}</h1>
            <p class="hdr-banner-subtitle">${esc(id.category || "")}</p>
          </div>
        </div>
        <span class="tbp-badge">DEVELOPER EXPORT</span>
      </div>
    </div>
    <dl class="meta-grid">
      <div class="meta-item"><dt>Service ID</dt><dd>${esc(id.id || "-")}</dd></div>
      <div class="meta-item"><dt>Version</dt><dd>${esc(id.version || "1.0")}</dd></div>
      <div class="meta-item"><dt>Status</dt><dd>${esc(id.status || "-")}</dd></div>
      <div class="meta-item"><dt>Service Owner</dt><dd>${esc(id.owner || "-")}</dd></div>
      <div class="meta-item"><dt>Effective Date</dt><dd>${esc(id.date || "-")}</dd></div>
    </dl>
  </header>

  <section class="tbp-sec">
    <h2>Implementation Mode</h2>
    <div class="tbp-card tbp-card--mode">
      <p class="tbp-mode-label">${esc(modeLabel)}</p>
      ${mode === "none" ? `<p class="tbp-field" style="margin-top:.25rem">Implementation mode not set. Select DWP Catalog, SRM/SRD, or Hybrid in the BMC Config tab.</p>` : ""}
    </div>
  </section>

  ${showDwp ? `<section class="tbp-sec">
    <h2>DWP Catalog Configuration</h2>
    ${dwpSection(bmc.dwp)}
  </section>` : ""}

  ${showSrm ? `<section class="tbp-sec">
    <h2>SRM / SRD Configuration</h2>
    ${srmSection(bmc.srm)}
  </section>` : ""}

  <section class="tbp-sec">
    <h2>Form Fields &amp; Variable Mapping</h2>
    <div class="table-wrap">
    <table class="tbp-tbl">
      <thead><tr><th>#</th><th>Field (EN / AR)</th><th>Type</th><th>Mandatory</th><th>BMC Variable</th><th>Initial Values</th><th>Dependency</th></tr></thead>
      <tbody>
        ${fields.map((f, i) => `<tr>
          <td>${i + 1}</td>
          <td><div>${esc(f.nameEn)}</div>${f.nameAr ? `<div class="field-ar" dir="rtl">${esc(f.nameAr)}</div>` : ""}</td>
          <td>${esc(f.type)}</td>
          <td>${esc(f.mandatory)}</td>
          <td>${f.bmcVariable ? `<span class="tbp-tag">${esc(f.bmcVariable)}</span>` : '<span class="tbp-empty">-</span>'}</td>
          <td>${esc(f.values || "").replace(/\n/g, "<br>")}</td>
          <td>${esc(f.dependency || "-")}</td>
        </tr>`).join("") || `<tr><td colspan="7" class="tbp-empty" style="text-align:center;padding:.75rem">No fields defined.</td></tr>`}
      </tbody>
    </table>
    </div>
  </section>

  <section class="tbp-sec">
    <h2>Workflow &amp; Approvals</h2>
    ${legendHtml}
    <div class="table-wrap">
    <table class="data workflow-rich">
      <thead><tr><th>#</th><th>Actor</th><th>Action / flow</th><th>Type / duration / notes</th><th>Outcome</th></tr></thead>
      <tbody>${workflowRows}</tbody>
    </table>
    </div>
  </section>

  <section class="tbp-sec">
    <h2>RACI Matrix</h2>
    <div class="table-wrap">
    <table class="tbp-tbl">
      <thead><tr><th>#</th><th>Step</th>${raciRoles.map((r) => `<th>${esc(r.label)}</th>`).join("")}</tr></thead>
      <tbody>
        ${raci.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.step)}</td>${raciRoles.map((role) => `<td>${esc(r[role.key] || "-")}</td>`).join("")}</tr>`).join("") || `<tr><td colspan="${2 + raciRoles.length}" class="tbp-empty" style="text-align:center;padding:.75rem">No RACI defined.</td></tr>`}
      </tbody>
    </table>
    </div>
  </section>

  <section class="tbp-sec">
    <h2>Actors</h2>
    <div class="table-wrap">
    <table class="tbp-tbl">
      <thead><tr><th>Name</th><th>Role</th><th>Department</th><th>Email</th></tr></thead>
      <tbody>
        ${actors.map((a) => { const { solid } = getActorPalette(a.name); return `<tr><td><span class="actor-cell"><span class="actor-dot" style="background:${solid}"></span>${esc(a.name)}</span></td><td>${esc(a.role)}</td><td>${esc(a.department)}</td><td>${esc(a.email)}</td></tr>`; }).join("") || `<tr><td colspan="4" class="tbp-empty" style="text-align:center;padding:.75rem">No actors defined.</td></tr>`}
      </tbody>
    </table>
    </div>
  </section>

  <section class="tbp-sec">
    <h2>SLA Configuration</h2>
    <div class="tbp-card">
      <div class="tbp-grid">
        ${fieldRow("Service", sla.service)}
        ${fieldRow("Requester(s)", sla.requester)}
        ${fieldRow("Support Group", sla.supportGroup)}
        ${fieldRow("Duration", sla.duration)}
        ${fieldRow("Controls", sla.controls)}
        ${fieldRow("Pre-Requisites", sla.prerequisites)}
        ${fieldRow("Notif 1 Owner", sla.notif1Who)}
        ${fieldRow("Notif 1 Threshold", sla.notif1When)}
        ${fieldRow("Notif 2 Owner", sla.notif2Who)}
        ${fieldRow("Notif 2 Threshold", sla.notif2When)}
      </div>
    </div>
    ${slaParts.length > 0 ? `<h3>SLA Parts (Multi-team)</h3>
    <div class="table-wrap"><table class="tbp-tbl">
      <thead><tr><th>Part / Phase</th><th>Responsible Team</th><th>Scope</th><th>SLA Duration</th><th>Target</th></tr></thead>
      <tbody>${slaParts.map((p) => `<tr><td>${esc(p.part)}</td><td>${esc(p.team)}</td><td>${esc(p.scope)}</td><td>${esc(p.duration)}</td><td>${esc(p.target)}</td></tr>`).join("")}</tbody>
    </table></div>` : ""}
    ${kpis.length > 0 ? `<h3>KPIs</h3>
    <div class="table-wrap"><table class="tbp-tbl">
      <thead><tr><th>KPI</th><th>Formula</th><th>Target</th><th>Owner</th><th>Frequency</th></tr></thead>
      <tbody>${kpis.map((k) => `<tr><td>${esc(k.name)}</td><td>${esc(k.formula)}</td><td>${esc(k.target)}</td><td>${esc(k.owner)}</td><td>${esc(k.frequency)}</td></tr>`).join("")}</tbody>
    </table></div>` : ""}
  </section>

  ${bmc.deploymentChecklist || bmc.localizationNotes ? `<section class="tbp-sec">
    <h2>Deployment &amp; Localization</h2>
    <div class="tbp-card">
      ${textBlock("Deployment & Validation Checklist", bmc.deploymentChecklist)}
      ${textBlock("Localization Requirements", bmc.localizationNotes)}
    </div>
  </section>` : ""}

  <section class="tbp-sec">
    <h2>Support Groups</h2>
    <div class="table-wrap">
    <table class="tbp-tbl">
      <thead><tr><th>#</th><th>Support Group</th><th>Names</th><th>Emails</th></tr></thead>
      <tbody>
        ${support.map((s, i) => `<tr><td>${i + 1}</td><td>${esc(s.supportGroup)}</td><td>${esc(s.names)}</td><td>${esc(s.emails)}</td></tr>`).join("") || `<tr><td colspan="4" class="tbp-empty" style="text-align:center;padding:.75rem">No support groups defined.</td></tr>`}
      </tbody>
    </table>
    </div>
  </section>

  <footer class="ft">Technical BMC Build Pack &middot; ${esc(id.name || "Service")} &middot; v${esc(id.version || "1.0")}</footer>
</div>
</body>
</html>`;
}
