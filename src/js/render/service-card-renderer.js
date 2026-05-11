import { esc } from "../utils/dom.js";
import { getActorPalette, uniqueWorkflowActors, outcomeTone } from "./actor-colors.js";
import { buildCardStyles } from "./card-styles.js";

/** Match app tokens - Loew @font-face loaded via link to fonts/loew-face.css */
const FONT_STACK = '"Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';
const FONT_AR_STACK = '"Loew Next Arabic", "Segoe UI", "Arabic UI Text", Tahoma, sans-serif';

/**
 * @param {{
 *   assetBase?: string,
 *   embeddedFontCss?: string,
 *   embeddedBackgroundDataUri?: string,
 *   embeddedVisualsDataUri?: string
 * }} [opts]
 * Self-contained output: set `embeddedFontCss` + data URIs so the file works from any folder without `/public`.
 */
function normalizeAssetBase(assetBase) {
  if (assetBase === null || typeof assetBase === "undefined" || assetBase === "") return "/";
  const s = String(assetBase);
  return s.endsWith("/") ? s : `${s}/`;
}

export function renderServiceCard(state, opts = {}) {
  const actors = state.actors || [];
  const workflow = state.workflow || [];
  const fields = state.fields || [];
  const raci = state.raci || [];
  const support = state.support || [];
  const kpis = state.kpis || [];
  const sla = state.sla || {};
  const slaParts = state.slaParts || [];
  const raciRoles = Array.isArray(state.raciConfig?.roles) ? state.raciConfig.roles : [];
  const root = normalizeAssetBase(opts.assetBase);
  const bgUrl = opts.embeddedBackgroundDataUri || `${root}Background.svg`;
  const visualsUrl = opts.embeddedVisualsDataUri || `${root}Visuals.svg`;
  const brand = {
    primary: "#1e40af",
    primaryDark: "#1e3a8a",
    surface: "#f1f5f9",
    ink: "#0f172a",
    muted: "#64748b",
    border: "#e2e8f0",
    accent: "#2563eb"
  };

  const styles = buildCardStyles({ fontStack: FONT_STACK, fontArStack: FONT_AR_STACK, bgUrl, visualsUrl, brand });

  const status = state.identity.status || "";
  const statusToneClass = status && !status.toLowerCase().includes("active") ? " status-pill--neutral" : "";

  const legendItems = uniqueWorkflowActors(workflow);
  const legendHtml =
    legendItems.length === 0
      ? ""
      : `<div class="workflow-legend">
        <div class="workflow-legend-title">Team roles</div>
        <div class="workflow-legend-chips">
          ${legendItems
            .map((label) => {
              const { solid } = getActorPalette(label);
              return `<span class="legend-chip" style="--sw:${solid}"><span class="legend-swatch"></span>${esc(label)}</span>`;
            })
            .join("")}
        </div>
      </div>`;

  const workflowRows =
    workflow.length === 0
      ? "<tr><td colspan='5' class='empty'>No workflow steps defined.</td></tr>"
      : workflow
          .map((w, i) => {
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
          })
          .join("");

  const flowPathHtml =
    workflow.length === 0
      ? ""
      : `<div class="flow-path-wrap">
          <div class="flow-path-title">Process sequence</div>
          <div class="flow-path">
            ${workflow
              .map((w, i) => {
                const { solid } = getActorPalette(w.actor);
                const arrow = i === 0 ? "" : '<span class="flow-arrow">&rarr;</span>';
                return `${arrow}<span class="flow-pill" style="--fp:${solid}">${esc(w.actor)}</span>`;
              })
              .join("")}
          </div>
        </div>`;

  const byActor = new Map();
  workflow.forEach((w) => {
    const k = String(w.actor || "-").trim();
    if (!byActor.has(k)) byActor.set(k, []);
    byActor.get(k).push(w.step);
  });
  const respCardsHtml =
    byActor.size === 0
      ? ""
      : `<div class="resp-grid">
          ${[...byActor.entries()]
            .map(([actor, steps]) => {
              const { solid } = getActorPalette(actor);
              return `<div class="resp-card" style="--rc:${solid}">
                <h4>${esc(actor)}</h4>
                <ul>${steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
              </div>`;
            })
            .join("")}
        </div>`;

  const totalSteps = workflow.length || 0;
  const approvalCount = workflow.filter((w) => String(w.type || "").toLowerCase() === "decision").length;
  const executionCount = workflow.filter((w) => String(w.type || "").toLowerCase() !== "decision").length;
  const supportGroup = sla.supportGroup || support.map((row) => row.supportGroup).filter(Boolean).join(", ") || "-";
  const kpiCount = kpis.length || 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(state.identity.name || "Service Card")}</title>
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
              <p class="hdr-kicker">Service Card</p>
              <h1 class="hdr-banner-title">${esc(state.identity.name || "Service Card")}</h1>
              <p class="hdr-banner-subtitle">${esc(state.identity.category || "Service documentation")}</p>
            </div>
          </div>
          ${status ? `<span class="status-pill status-pill--on-dark${statusToneClass}">${esc(status)}</span>` : ""}
        </div>
      </div>
      ${state.identity.nameAr ? `<div class="hdr-ar"><p class="title-ar" dir="rtl">${esc(state.identity.nameAr)}</p></div>` : ""}
      <dl class="meta-grid">
        <div class="meta-item"><dt>Service ID</dt><dd>${esc(state.identity.id || "-")}</dd></div>
        <div class="meta-item"><dt>Version</dt><dd>${esc(state.identity.version || "1.0")}</dd></div>
        <div class="meta-item"><dt>Category</dt><dd>${esc(state.identity.category || "-")}</dd></div>
        <div class="meta-item"><dt>Owner</dt><dd>${esc(state.identity.owner || "-")}</dd></div>
        <div class="meta-item"><dt>Date</dt><dd>${esc(state.identity.date || "-")}</dd></div>
      </dl>
    </header>

    <section class="sec sec--summary">
      <h2>Document summary</h2>
      <dl class="summary-grid">
        <div class="summary-card"><dt>SLA duration</dt><dd>${esc(sla.duration || "-")}</dd></div>
        <div class="summary-card"><dt>Support group</dt><dd>${esc(supportGroup)}</dd></div>
        <div class="summary-card"><dt>KPI count</dt><dd>${esc(String(kpiCount))}</dd></div>
        <div class="summary-card"><dt>Workflow steps</dt><dd>${esc(String(totalSteps))}</dd></div>
        <div class="summary-card"><dt>Approvals</dt><dd>${esc(String(approvalCount))}</dd></div>
      </dl>
    </section>

    <section class="sec">
      <h2>Service description</h2>
      <div class="card">
        <div class="prose">${esc(state.identity.description || "No description provided.").replace(/\n/g, "<br>")}</div>
      </div>
      ${
        state.identity.descriptionAr
          ? `<div class="card" dir="rtl">
        <div class="prose">${esc(state.identity.descriptionAr).replace(/\n/g, "<br>")}</div>
      </div>`
          : ""
      }
    </section>

    <section class="sec">
      <h2>Actors</h2>
      <div class="table-wrap">
      <table class="data">
        <thead><tr><th>Name</th><th>Role</th><th>Department</th><th>Email</th></tr></thead>
        <tbody>
      ${actors
        .map((a) => {
          const { solid } = getActorPalette(a.name);
          return `<tr><td><span class="actor-cell"><span class="actor-dot" style="background:${solid}"></span>${esc(a.name)}</span></td><td>${esc(a.role)}</td><td>${esc(a.department)}</td><td>${esc(a.email)}</td></tr>`;
        })
        .join("") || "<tr><td colspan='4' class='empty'>No actors defined.</td></tr>"}
        </tbody>
      </table>
      </div>
    </section>

    <section class="sec sec--workflow">
      <h2>Workflow &amp; approvals</h2>
      ${legendHtml}
      <div class="table-wrap">
      <table class="data workflow-rich">
        <thead><tr><th>#</th><th>Actor</th><th>Action / flow</th><th>Type / duration / notes</th><th>Outcome</th></tr></thead>
        <tbody>
      ${workflowRows}
        </tbody>
      </table>
      </div>
      ${flowPathHtml}
      ${respCardsHtml}
    </section>

    <section class="sec">
      <h2>Process overview</h2>
      <div class="card">
        <div class="prose">Workflow is the authoritative process definition. Assignments, approvals, durations, and conditions are declared directly in workflow steps.</div>
        <dl class="process-metrics">
          <div class="process-metric"><dt>Total steps</dt><dd>${esc(String(totalSteps))}</dd></div>
          <div class="process-metric"><dt>Approvals</dt><dd>${esc(String(approvalCount))}</dd></div>
          <div class="process-metric"><dt>Execution steps</dt><dd>${esc(String(executionCount))}</dd></div>
          <div class="process-metric"><dt>SLA duration</dt><dd>${esc(sla.duration || "-")}</dd></div>
        </dl>
      </div>
    </section>

    <section class="sec">
      <h2>Form template</h2>
      <div class="table-wrap">
      <table class="data">
        <thead><tr><th>#</th><th>Field name (EN / AR)</th><th>Field type</th><th>Initial values</th><th>Question (AR)</th><th>Mandatory</th><th>Dependency</th></tr></thead>
        <tbody>
      ${fields
        .map(
          (f, i) =>
            `<tr><td>${i + 1}</td><td><div>${esc(f.nameEn)}</div><div class="field-ar" dir="rtl">${esc(f.nameAr)}</div></td><td>${esc(f.type)}</td><td>${esc(f.values).replace(/\n/g, "<br>")}</td><td dir="rtl">${esc(f.questionAr)}</td><td>${esc(f.mandatory)}</td><td>${esc(f.dependency)}</td></tr>`
        )
        .join("") || "<tr><td colspan='7' class='empty'>No fields defined.</td></tr>"}
        </tbody>
      </table>
      </div>
    </section>

    <section class="sec">
      <h2>RACI matrix</h2>
      <div class="table-wrap">
      <table class="data">
        <thead><tr><th>#</th><th>Step</th>${raciRoles.map((role) => `<th>${esc(role.label)}</th>`).join("")}</tr></thead>
        <tbody>
      ${
        raci.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.step)}</td>${raciRoles.map((role) => `<td>${esc(r[role.key] || "-")}</td>`).join("")}</tr>`).join("") ||
        `<tr><td colspan="${2 + raciRoles.length}" class='empty'>No RACI rows defined.</td></tr>`
      }
        </tbody>
      </table>
      </div>
    </section>

    <section class="sec">
      <h2>Support groups</h2>
      <div class="table-wrap">
      <table class="data">
        <thead><tr><th>#</th><th>Support group</th><th>Names</th><th>Emails</th></tr></thead>
        <tbody>
      ${support.map((s, i) => `<tr><td>${i + 1}</td><td>${esc(s.supportGroup)}</td><td>${esc(s.names)}</td><td>${esc(s.emails)}</td></tr>`).join("") || "<tr><td colspan='4' class='empty'>No support groups defined.</td></tr>"}
        </tbody>
      </table>
      </div>
    </section>

    <section class="sec">
      <h2>SLA &amp; escalation</h2>
      <div class="table-wrap">
      <table class="data">
        <thead><tr><th>Service</th><th>Requester(s)</th><th>Pre-requisites</th><th>Support group</th><th>Controls</th><th>Duration</th><th>Approval (who)</th><th>Approval (when)</th></tr></thead>
        <tbody>
      <tr>
        <td>${esc(sla.service)}</td>
        <td>${esc(sla.requester)}</td>
        <td>${esc(sla.prerequisites)}</td>
        <td>${esc(sla.supportGroup)}</td>
        <td>${esc(sla.controls)}</td>
        <td>${esc(sla.duration)}</td>
        <td>${esc(sla.notif1Who)}<br><span class="muted">${esc(sla.notif2Who)}</span></td>
        <td>${esc(sla.notif1When)}<br><span class="muted">${esc(sla.notif2When)}</span></td>
      </tr>
        </tbody>
      </table>
      </div>
      <h3 class="sec-subtitle">SLA parts (multi-team)</h3>
      <div class="table-wrap">
      <table class="data">
        <thead><tr><th>Part / phase</th><th>Responsible team</th><th>Scope</th><th>SLA duration</th><th>Target</th></tr></thead>
        <tbody>
      ${slaParts.map((p) => `<tr><td>${esc(p.part)}</td><td>${esc(p.team)}</td><td>${esc(p.scope)}</td><td>${esc(p.duration)}</td><td>${esc(p.target)}</td></tr>`).join("") || "<tr><td colspan='5' class='empty'>No SLA parts defined.</td></tr>"}
        </tbody>
      </table>
      </div>
      <h3 class="sec-subtitle">KPIs</h3>
      <div class="table-wrap">
        <table class="data">
          <thead><tr><th>KPI</th><th>Formula</th><th>Target</th><th>Responsibility</th><th>Frequency</th></tr></thead>
          <tbody>
        ${kpis.map((k) => `<tr><td>${esc(k.name)}</td><td>${esc(k.formula)}</td><td>${esc(k.target)}</td><td>${esc(k.owner)}</td><td>${esc(k.frequency)}</td></tr>`).join("") || "<tr><td colspan='5' class='empty'>No KPIs defined.</td></tr>"}
          </tbody>
        </table>
      </div>
    </section>

    <footer class="ft">Damee Service Card Builder &middot; ${esc(state.identity.name || "Service Card")}</footer>
  </div>
</body>
</html>`;
}
