import { esc } from "../utils/dom.js";
import { getActorPalette, uniqueWorkflowActors, outcomeTone } from "./actor-colors.js";

/** Match app tokens — Loew @font-face loaded via link to fonts/loew-face.css */
const FONT_STACK = '"Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';
const FONT_AR_STACK = '"Loew Next Arabic", "Segoe UI", "Arabic UI Text", Tahoma, sans-serif';
const DEFAULT_FAV_LOGO_URL = new URL("../../../Aassets/fav/safari-pinned-tab.svg", import.meta.url).href;

/** Strip XML prolog so inline SVG is valid inside HTML. */
function stripXmlProlog(svg) {
  return String(svg || "").replace(/<\?xml[^?]*\?>\s*/i, "").trim();
}

/**
 * @param {{
 *   assetBase?: string,
 *   inlineLogoSvg?: string,
 *   inlineLogoDataUrl?: string,
 *   embeddedFontCss?: string,
 *   embeddedBackgroundDataUri?: string,
 *   embeddedVisualsDataUri?: string
 * }} [opts]
 * Self-contained output: set `embeddedFontCss` + data URIs + `inlineLogoSvg` so the file works from any folder without `/public`.
 */
function normalizeAssetBase(assetBase) {
  if (assetBase == null || assetBase === "") return "/";
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
  const logoPath = DEFAULT_FAV_LOGO_URL || `${root}Aassets/fav/safari-pinned-tab.svg`;
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

  const styles = `
    :root {
      --ink: ${brand.ink};
      --muted: ${brand.muted};
      --border: ${brand.border};
      --surface: ${brand.surface};
      --primary: ${brand.primary};
      --primary-dark: ${brand.primaryDark};
      --accent: ${brand.accent};
      --card-bg: #f8fafc;
      --radius: 10px;
      --radius-sm: 6px;
      --shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
      --shadow-lg: 0 12px 40px rgba(15, 23, 42, 0.08);
    }
    * { box-sizing: border-box; }
    html { font-size: 15px; -webkit-font-smoothing: antialiased; }
    body {
      font-family: ${FONT_STACK};
      margin: 0;
      color: var(--ink);
      line-height: 1.55;
      min-height: 100%;
      padding: 0;
      background-image:
        linear-gradient(180deg, rgba(248, 250, 252, 0.94) 0%, rgba(241, 245, 249, 0.9) 55%, rgba(238, 242, 247, 0.92) 100%),
        url("${bgUrl}");
      background-size: cover, cover;
      background-position: center top, center top;
      background-attachment: fixed;
      background-repeat: no-repeat;
    }
    body::after {
      content: "";
      position: fixed;
      inset: 0;
      background: url("${visualsUrl}") no-repeat right 6% bottom 10%;
      background-size: min(520px, 46vw);
      opacity: 0.42;
      pointer-events: none;
      z-index: 0;
    }
    .doc {
      position: relative;
      z-index: 1;
      max-width: 960px;
      margin: 0 auto;
      background: #fff;
      box-shadow: var(--shadow-lg);
      border-radius: 0 0 var(--radius) var(--radius);
      overflow: hidden;
      border: 1px solid rgba(148, 163, 184, 0.35);
      border-top: none;
    }
    .hdr {
      padding: 0;
      background: #fff;
      color: var(--ink);
      border-bottom: 1px solid var(--border);
    }
    .hdr-banner {
      background: linear-gradient(118deg, #0f172a 0%, #1e3a8a 46%, #2563eb 96%);
      color: #fff;
      padding: 1.2rem 2rem 1.35rem;
    }
    .hdr-banner-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .hdr-banner-main {
      display: flex;
      align-items: center;
      gap: 1rem;
      min-width: 0;
    }
    .logo {
      height: 46px;
      width: auto;
      max-width: 220px;
      object-fit: contain;
    }
    .logo-svg-wrap {
      display: block;
      flex-shrink: 0;
      line-height: 0;
    }
    .logo-svg-wrap.logo--banner svg {
      height: 44px;
      width: auto;
      max-width: 200px;
      display: block;
    }
    .logo--banner {
      height: 44px;
      max-width: 200px;
    }
    .hdr-kicker {
      font-size: 0.62rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      opacity: 0.88;
      margin: 0 0 0.3rem;
    }
    .hdr-banner-title {
      font-size: 1.45rem;
      font-weight: 800;
      line-height: 1.2;
      margin: 0;
      letter-spacing: -0.02em;
    }
    .hdr-ar {
      padding: 0.85rem 2rem;
      background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
      border-bottom: 1px solid var(--border);
    }
    .title-ar {
      font-size: 1.2rem;
      font-weight: 700;
      line-height: 1.45;
      text-align: right;
      margin: 0;
      font-family: ${FONT_AR_STACK};
      color: #1e3a8a;
    }
    .status-pill {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 0.4rem 0.85rem;
      border-radius: 999px;
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
    }
    .status-pill--neutral {
      background: #f1f5f9;
      color: var(--muted);
      border-color: var(--border);
    }
    .status-pill--on-dark {
      background: rgba(255, 255, 255, 0.14);
      color: #fff;
      border-color: rgba(255, 255, 255, 0.35);
    }
    .status-pill--on-dark.status-pill--neutral {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.85);
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 0.65rem 1.25rem;
      padding: 1.1rem 2rem 1.35rem;
      margin: 0;
      background: var(--surface);
      border-top: 1px solid var(--border);
    }
    .meta-item {
      margin: 0;
    }
    .meta-item dt {
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--muted);
      margin: 0 0 0.2rem;
    }
    .meta-item dd {
      margin: 0;
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--ink);
      word-break: break-word;
    }
    .sec {
      padding: 1.5rem 2rem 1.65rem;
      border-top: 1px solid var(--border);
    }
    .sec .card + .card {
      margin-top: 0.85rem;
    }
    .sec h2 {
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--primary);
      margin: 0 0 0.9rem;
    }
    .sec-subtitle {
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--primary);
      margin: 1.35rem 0 0.75rem;
    }
    .prose {
      font-size: 0.92rem;
      line-height: 1.65;
      color: #334155;
      orphans: 3;
      widows: 3;
    }
    .prose + .prose {
      margin-top: 0.85rem;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 1rem 1.15rem;
      box-shadow: var(--shadow);
    }
    .card[dir="rtl"] {
      border-right: 3px solid var(--accent);
      border-left: 1px solid var(--border);
    }
    .card:not([dir="rtl"]) {
      border-left: 3px solid var(--accent);
    }
    .table-wrap {
      overflow-x: auto;
      margin: 0;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
      background: #fff;
    }
    table.data {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.82rem;
      font-variant-numeric: tabular-nums;
    }
    table.data th,
    table.data td {
      padding: 0.55rem 0.65rem;
      border-bottom: 1px solid #f1f5f9;
      text-align: left;
      vertical-align: top;
    }
    table.data th {
      background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
      color: #475569;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      white-space: nowrap;
    }
    table.data tbody tr:nth-child(even) td {
      background: #fafbfc;
    }
    table.data tbody tr:last-child td {
      border-bottom: none;
    }
    table.data td.empty,
    table.data .muted {
      color: var(--muted);
      font-style: italic;
    }
    .field-ar {
      margin-top: 0.35rem;
      color: #475569;
      font-size: 0.92em;
    }
    .actor-dot {
      display: inline-block;
      width: 0.55rem;
      height: 0.55rem;
      border-radius: 2px;
      margin-right: 0.45rem;
      vertical-align: middle;
      flex-shrink: 0;
    }
    .actor-cell {
      display: flex;
      align-items: center;
      font-weight: 600;
    }
    .sec--workflow h2 {
      color: #334155;
      letter-spacing: 0.06em;
    }
    .workflow-legend {
      margin: 0 0 1rem;
      padding: 0.85rem 1.1rem;
      background: #fafbfc;
      border: 1px solid #e8edf2;
      border-radius: 8px;
    }
    .workflow-legend-title {
      font-size: 0.65rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #64748b;
      margin: 0 0 0.65rem;
    }
    .workflow-legend-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem 0.75rem;
      align-items: center;
    }
    .legend-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.72rem;
      font-weight: 500;
      color: #334155;
      padding: 0.35rem 0.7rem;
      background: #fff;
      border-radius: 999px;
      border: 1px solid #e8edf2;
    }
    .legend-swatch {
      width: 0.45rem;
      height: 0.45rem;
      border-radius: 50%;
      background: var(--sw);
      flex-shrink: 0;
    }
    table.workflow-rich {
      font-size: 0.8rem;
    }
    table.workflow-rich tbody tr:nth-child(even) td {
      background: transparent;
    }
    table.workflow-rich tbody tr {
      --row-solid: #64748b;
      --row-light: #f8fafc;
    }
    table.workflow-rich td {
      border-bottom: 1px solid #eef2f6;
      padding: 0.65rem 0.7rem;
    }
    table.workflow-rich thead th {
      background: #f8fafc;
      color: #475569;
      font-weight: 600;
      letter-spacing: 0.05em;
      font-size: 0.62rem;
      padding: 0.55rem 0.7rem;
    }
    .wf-num {
      width: 2.75rem;
      text-align: center;
      vertical-align: middle !important;
      background: var(--row-light) !important;
    }
    .step-disc {
      display: inline-flex;
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;
      align-items: center;
      justify-content: center;
      font-size: 0.68rem;
      font-weight: 600;
      background: #fff;
      color: var(--row-solid);
      border: 1.5px solid var(--row-solid);
    }
    .wf-actor {
      background: var(--row-light) !important;
      color: #0f172a !important;
      font-weight: 600 !important;
      font-size: 0.78rem !important;
      max-width: 11rem;
      line-height: 1.4;
      border-left: 3px solid var(--row-solid) !important;
      box-shadow: inset 1px 0 0 rgba(255, 255, 255, 0.6);
    }
    .wf-action {
      background: #fff !important;
      min-width: 9rem;
      color: #334155;
      line-height: 1.5;
    }
    .wf-meta {
      background: #fff !important;
      font-size: 0.76rem;
      color: #475569;
    }
    .wf-out {
      background: #fff !important;
      vertical-align: middle !important;
    }
    .type-chip {
      display: inline-block;
      font-size: 0.62rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
      margin-bottom: 0.3rem;
    }
    .wf-sub {
      font-size: 0.74rem;
      color: #64748b;
      margin-top: 0.2rem;
      line-height: 1.45;
    }
    .outcome-pill {
      display: inline-block;
      font-size: 0.62rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 0.28rem 0.55rem;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      background: #fafbfc;
      color: #475569;
    }
    .outcome--start {
      border-color: #bbf7d0;
      background: #f7fef9;
      color: #166534;
    }
    .outcome--decision {
      border-color: #fde68a;
      background: #fffbeb;
      color: #a16207;
    }
    .outcome--action {
      border-color: #bfdbfe;
      background: #f8fafc;
      color: #1d4ed8;
    }
    .outcome--end {
      border-color: #e2e8f0;
      background: #f8fafc;
      color: #64748b;
    }
    .outcome--neutral {
      border-color: #e2e8f0;
      background: #f8fafc;
      color: #475569;
    }
    .flow-path-wrap {
      margin: 1.1rem 0 0;
      padding: 0.85rem 1rem;
      background: #fafbfc;
      border: 1px solid #e8edf2;
      border-radius: 8px;
    }
    .flow-path-title {
      font-size: 0.65rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #64748b;
      margin: 0 0 0.65rem;
    }
    .flow-path {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.4rem 0.15rem;
    }
    .flow-pill {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--fp);
      padding: 0.4rem 0.75rem;
      border-radius: 999px;
      background: #fff;
      border: 1.5px solid var(--fp);
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
    }
    .flow-arrow {
      color: #cbd5e1;
      font-weight: 500;
      font-size: 0.75rem;
      padding: 0 0.15rem;
      user-select: none;
    }
    .resp-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
      gap: 0.75rem;
      margin-top: 1.1rem;
    }
    .resp-card {
      background: #fff;
      border: 1px solid #e8edf2;
      border-radius: 8px;
      padding: 0.75rem 0.9rem 0.95rem;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
      border-top: 2px solid var(--rc);
    }
    .resp-card h4 {
      margin: 0 0 0.5rem;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--rc);
      letter-spacing: -0.01em;
    }
    .resp-card ul {
      margin: 0;
      padding-left: 1rem;
      font-size: 0.74rem;
      color: #64748b;
      line-height: 1.5;
    }
    .resp-card li {
      margin-bottom: 0.25rem;
    }
    .process-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.65rem;
      margin-top: 0.8rem;
    }
    .process-metric {
      border: 1px solid #e8edf2;
      border-radius: 8px;
      background: #fff;
      padding: 0.65rem 0.75rem;
    }
    .process-metric dt {
      margin: 0 0 0.25rem;
      font-size: 0.62rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      font-weight: 700;
    }
    .process-metric dd {
      margin: 0;
      font-size: 0.9rem;
      font-weight: 700;
      color: #0f172a;
    }
    .ft {
      padding: 1rem 2rem 1.25rem;
      background: #0f172a;
      color: #94a3b8;
      font-size: 0.68rem;
      text-align: center;
      letter-spacing: 0.02em;
    }
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }

      @page {
        size: A4 portrait;
        margin: 11mm 12mm 14mm 12mm;
      }

      html {
        font-size: 9.75pt;
      }

      body {
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        background-image: none !important;
        color: #0f172a !important;
      }

      body::after {
        display: none !important;
        content: none !important;
      }

      .doc {
        box-shadow: none !important;
        border: none !important;
        border-radius: 0 !important;
        max-width: none !important;
        width: 100% !important;
        margin: 0 !important;
        background: #fff !important;
      }

      .logo {
        max-height: 38px !important;
        width: auto !important;
      }

      .logo-svg-wrap svg {
        max-height: 38px !important;
        width: auto !important;
      }

      .hdr-banner {
        break-after: avoid;
        page-break-after: avoid;
      }

      .hdr-ar,
      .meta-grid {
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .sec h2,
      .sec-subtitle {
        break-after: avoid;
        page-break-after: avoid;
      }

      .workflow-legend,
      .flow-path-wrap {
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .resp-grid {
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .card {
        break-inside: auto;
        page-break-inside: auto;
        border: 1px solid #cbd5e1 !important;
        box-shadow: none !important;
        background: #fff !important;
      }

      .table-wrap {
        break-inside: auto;
        page-break-inside: auto;
        overflow: visible !important;
        border: 1px solid #94a3b8 !important;
        border-radius: 4px !important;
        background: #fff !important;
      }

      table.data {
        width: 100%;
        font-size: 8.15pt;
        border-collapse: collapse !important;
      }

      table.data thead {
        display: table-header-group;
      }

      table.data th,
      table.data td {
        border: 0.35pt solid #64748b !important;
        padding: 4px 5px !important;
        vertical-align: top !important;
      }

      table.data th {
        background: linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%) !important;
        color: #1e293b !important;
        font-size: 7.25pt !important;
      }

      table.data:not(.workflow-rich) tbody tr:nth-child(even) td {
        background: #f8fafc !important;
      }

      table.data tr {
        break-inside: avoid;
        page-break-inside: avoid;
      }

      table.workflow-rich tbody tr {
        break-inside: avoid;
        page-break-inside: avoid;
      }

      table.workflow-rich .wf-actor,
      table.workflow-rich .wf-num {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .ft {
        break-inside: avoid;
        page-break-inside: avoid;
        margin-top: 0.35rem;
        padding-top: 0.75rem !important;
        border-top: 1px solid #cbd5e1 !important;
        background: #0f172a !important;
        color: #cbd5e1 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .status-pill,
      .type-chip,
      .outcome-pill,
      .flow-pill,
      .legend-chip,
      .step-disc,
      .resp-card,
      .actor-dot {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .prose {
        orphans: 3;
        widows: 3;
      }
    }
  `;

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
                const arrow = i === 0 ? "" : '<span class="flow-arrow">→</span>';
                return `${arrow}<span class="flow-pill" style="--fp:${solid}">${esc(w.actor)}</span>`;
              })
              .join("")}
          </div>
        </div>`;

  const byActor = new Map();
  workflow.forEach((w) => {
    const k = String(w.actor || "—").trim();
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

  const logoHtml =
    typeof opts.inlineLogoSvg === "string" && opts.inlineLogoSvg.trim()
      ? `<div class="logo-svg-wrap logo logo--banner" role="img" aria-label="Damee Logo">${stripXmlProlog(opts.inlineLogoSvg)}</div>`
      : typeof opts.inlineLogoDataUrl === "string" && opts.inlineLogoDataUrl.trim()
        ? `<img src="${opts.inlineLogoDataUrl}" class="logo logo--banner" alt="Damee Logo" width="200" height="48">`
        : `<img src="${logoPath}" class="logo logo--banner" alt="Damee Logo" width="200" height="48">`;

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
            ${logoHtml}
            <div>
              <p class="hdr-kicker">Damee Service Card Builder</p>
              <h1 class="hdr-banner-title">${esc(state.identity.name || "Service Card")}</h1>
            </div>
          </div>
          ${status ? `<span class="status-pill status-pill--on-dark${statusToneClass}">${esc(status)}</span>` : ""}
        </div>
      </div>
      ${state.identity.nameAr ? `<div class="hdr-ar"><p class="title-ar" dir="rtl">${esc(state.identity.nameAr)}</p></div>` : ""}
      <dl class="meta-grid">
        <div class="meta-item"><dt>Service ID</dt><dd>${esc(state.identity.id || "—")}</dd></div>
        <div class="meta-item"><dt>Version</dt><dd>${esc(state.identity.version || "1.0")}</dd></div>
        <div class="meta-item"><dt>Category</dt><dd>${esc(state.identity.category || "—")}</dd></div>
        <div class="meta-item"><dt>Owner</dt><dd>${esc(state.identity.owner || "—")}</dd></div>
        <div class="meta-item"><dt>Date</dt><dd>${esc(state.identity.date || "—")}</dd></div>
      </dl>
    </header>

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
        <thead><tr><th>#</th><th>Actor</th><th>Action / flow</th><th>Type · duration · notes</th><th>Outcome</th></tr></thead>
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
          <div class="process-metric"><dt>Total steps</dt><dd>${esc(String(workflow.length || 0))}</dd></div>
          <div class="process-metric"><dt>Approvals</dt><dd>${esc(String(workflow.filter((w) => String(w.type || "").toLowerCase() === "decision").length))}</dd></div>
          <div class="process-metric"><dt>Execution steps</dt><dd>${esc(String(workflow.filter((w) => String(w.type || "").toLowerCase() !== "decision").length))}</dd></div>
          <div class="process-metric"><dt>SLA duration</dt><dd>${esc(sla.duration || "—")}</dd></div>
        </dl>
      </div>
    </section>

    <section class="sec">
      <h2>Form template</h2>
      <div class="table-wrap">
      <table class="data">
        <thead><tr><th>#</th><th>Field name (EN / AR)</th><th>Field type</th><th>Initial values</th><th>السؤال بالعربية</th><th>Mandatory</th><th>Dependency</th></tr></thead>
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

    <footer class="ft">Damee Service Card Builder · ${esc(state.identity.name || "Service Card")}</footer>
  </div>
</body>
</html>`;
}
