import { renderBusinessCard } from "./business-card-renderer.js";
import { renderTechnicalBuildPack } from "./technical-build-pack-renderer.js";
import { esc } from "../utils/dom.js";

function extractStyles(html) {
  const out = [];
  const re = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = re.exec(html)) !== null) out.push(m[1]);
  return out.join("\n");
}

function extractFontLink(html) {
  const m = html.match(/<link[^>]+loew-face\.css[^>]*>/i);
  return m ? m[0] : "";
}

function extractBody(html) {
  const m = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return m ? m[1].trim() : html;
}

/**
 * Full Governance Pack — combines Business Service Card, Technical BMC Build Pack,
 * and Governance sign-off into a single document.
 *
 * @param {object} state
 * @param {{ assetBase?: string, embeddedFontCss?: string, embeddedBackgroundDataUri?: string, embeddedVisualsDataUri?: string }} [opts]
 */
export function renderServiceCard(state, opts = {}) {
  const id = state.identity || {};
  const gov = state.governance || {};

  const bcHtml = renderBusinessCard(state, opts);
  const tbpHtml = renderTechnicalBuildPack(state, opts);

  const fontLink = extractFontLink(bcHtml);
  const bcStyles = extractStyles(bcHtml);
  const tbpStyles = extractStyles(tbpHtml);
  const bcBody = extractBody(bcHtml);
  const tbpBody = extractBody(tbpHtml);

  const name = esc(id.name || "Service");
  const category = esc(id.category || "Service documentation");
  const version = esc(id.version || "1.0");
  const owner = esc(id.owner || "-");
  const status = esc(id.status || "-");

  const govStampCells = [
    { label: "Prepared By", value: gov.preparedBy },
    { label: "Reviewed By", value: gov.reviewedBy },
    { label: "Approved By", value: gov.approvedBy },
    { label: "Approval Date", value: gov.approvalDate },
    { label: "Next Review Date", value: id.reviewDate }
  ]
    .map((r) => `<div class="gov-stamp-cell"><dt>${esc(r.label)}</dt><dd>${esc(r.value || "")}</dd></div>`)
    .join("");

  const govChecks = [
    { checked: gov.businessOwnerSignedOff, label: "Business owner has reviewed and signed off" },
    { checked: gov.itilAligned, label: "ITIL alignment confirmed — service is predefined, requestable, has owner, SLA, and KPIs" },
    { checked: gov.uatCompleted, label: "UAT completed — acceptance criteria validated in staging" }
  ]
    .map((c) => `<li class="${c.checked ? "is-checked" : "is-unchecked"}">${esc(c.label)}</li>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Full Governance Pack — ${name}</title>
  ${fontLink}
  <style>${tbpStyles}</style>
  <style>${bcStyles}</style>
  <style>
    .fgp-shell { max-width: 1040px; margin: 0 auto; }
    .fgp-cover { position: relative; z-index: 1; max-width: 960px; margin: 0 auto 1.25rem; background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 62%, #0f766e 100%); color: #fff; border-radius: 14px; box-shadow: 0 24px 70px rgba(15, 23, 42, .14); overflow: hidden; border: 1px solid rgba(255, 255, 255, .16); }
    .fgp-cover::after { content:""; position:absolute; inset:auto -8rem -10rem auto; width:24rem; height:24rem; border-radius:50%; background:rgba(153,246,228,.16); pointer-events:none; }
    .fgp-cover-inner { position: relative; z-index: 1; padding: 2rem; }
    .fgp-cover-kicker { margin: 0 0 .65rem; color: #99f6e4; font-size: .68rem; font-weight: 800; text-transform: uppercase; letter-spacing: .14em; }
    .fgp-cover h1 { margin: 0; max-width: 42rem; font-size: 2rem; line-height: 1.12; letter-spacing: -0.02em; }
    .fgp-cover-subtitle { margin: .55rem 0 0; color: rgba(255,255,255,.78); font-size: .92rem; font-weight: 600; }
    .fgp-cover-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(145px, 1fr)); gap: .7rem; margin: 1.35rem 0 0; }
    .fgp-cover-cell { margin: 0; padding: .75rem .85rem; border: 1px solid rgba(255,255,255,.2); border-radius: 8px; background: rgba(255,255,255,.08); }
    .fgp-cover-cell dt { margin: 0 0 .2rem; color: rgba(255,255,255,.62); font-size: .62rem; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; }
    .fgp-cover-cell dd { margin: 0; color: #fff; font-size: .88rem; font-weight: 700; overflow-wrap: anywhere; }
    .fgp-part { position: relative; z-index: 1; margin: 0 auto 1.25rem; max-width: 960px; }
    .fgp-part + .fgp-part { page-break-before: always; break-before: page; }
    .fgp-part-header { display:flex;align-items:center;justify-content:space-between;gap:1rem;background:#fff;color:#0f172a;font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.12em;padding:.8rem 1rem;margin:0 0 .55rem;border:1px solid #e2e8f0;border-radius:10px;box-shadow:0 1px 2px rgba(15,23,42,.05);font-family:"Segoe UI",system-ui,sans-serif; }
    .fgp-part-number { color:#0f766e; }
    .gov-section { position:relative;z-index:1;max-width: 960px; margin: 0 auto; padding: 1.5rem 2rem 2rem; background:#fff; border:1px solid #e2e8f0; border-radius:12px; box-shadow:0 24px 70px rgba(15,23,42,.12); font-family: "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif; }
    .gov-section h2 { display:flex;align-items:center;gap:.65rem;font-size:.78rem;font-weight:800;color:#0f766e;text-transform:uppercase;letter-spacing:.09em;border:0;padding:0;margin:0 0 .85rem; }
    .gov-section h2::after { content:"";height:1px;flex:1;background:linear-gradient(90deg,#99f6e4,rgba(203,213,225,0)); }
    .gov-stamp { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: .75rem; }
    .gov-stamp-cell { border: 1px solid #e2e8f0; border-radius: 8px; padding: .7rem .8rem; background:#fbfdff; }
    .gov-stamp-cell dt { font-size: .66rem; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; color: #64748b; }
    .gov-stamp-cell dd { margin: 0; font-size: .86rem; color: #0f172a; min-height: 1.8rem; border-top: 1px solid #e2e8f0; margin-top: .45rem; padding-top: .35rem; overflow-wrap:anywhere; }
    .gov-checklist { list-style: none; margin: .5rem 0 0; padding: 0; }
    .gov-checklist li { padding: .35rem 0; font-size: .9rem; display: flex; align-items: center; gap: .6rem; }
    .gov-checklist li.is-checked { color: #0f172a; }
    .gov-checklist li.is-unchecked { color: #94a3b8; }
    .gov-checklist li.is-checked::before { content: "\\2611"; color: #2563eb; font-size: 1rem; }
    .gov-checklist li.is-unchecked::before { content: "\\2610"; font-size: 1rem; }
    .gov-notes { font-size: .9rem; color: #0f172a; line-height: 1.6; margin: .35rem 0 0; overflow-wrap:anywhere; }
    .gov-footer { text-align: center; padding: 1rem 1.5rem 1.25rem; font-size: .72rem; color: #64748b; margin-top: 1rem; font-family: "Segoe UI", system-ui, sans-serif; }
    @media print {
      .fgp-shell, .fgp-cover, .fgp-part, .gov-section { max-width:none !important; width:100% !important; box-shadow:none !important; }
      .fgp-cover { border-radius:0 !important; margin:0 0 8mm !important; break-after:page; page-break-after:always; }
      .fgp-cover-inner { padding:12mm 0 10mm !important; }
      .fgp-cover h1 { font-size:20pt !important; }
      .fgp-part { margin:0 !important; }
      .fgp-part-header { border-radius:0 !important; box-shadow:none !important; padding:5mm 0 3mm !important; border-width:0 0 1px !important; margin:0 0 4mm !important; }
      .fgp-part + .fgp-part { break-before:page; page-break-before:always; }
      .gov-section { border:none !important; border-radius:0 !important; padding:0 !important; }
      .gov-section h2 { font-size:8pt !important; margin-bottom:.45rem; color:#0f766e !important; }
      .gov-section h2::after { background:#cbd5e1 !important; }
    }
  </style>
</head>
<body>
  <main class="fgp-shell">
  <section class="fgp-cover">
    <div class="fgp-cover-inner">
      <p class="fgp-cover-kicker">Full Governance Pack</p>
      <h1>${name}</h1>
      <p class="fgp-cover-subtitle">${category}</p>
      <dl class="fgp-cover-grid">
        <div class="fgp-cover-cell"><dt>Version</dt><dd>${version}</dd></div>
        <div class="fgp-cover-cell"><dt>Status</dt><dd>${status}</dd></div>
        <div class="fgp-cover-cell"><dt>Service Owner</dt><dd>${owner}</dd></div>
        <div class="fgp-cover-cell"><dt>Review Date</dt><dd>${esc(id.reviewDate || "-")}</dd></div>
      </dl>
    </div>
  </section>

  <section class="fgp-part">
    <p class="fgp-part-header"><span class="fgp-part-number">Part 1</span><span>Business Service Card</span></p>
    ${bcBody}
  </section>

  <section class="fgp-part">
    <p class="fgp-part-header"><span class="fgp-part-number">Part 2</span><span>Technical BMC Build Pack</span></p>
    ${tbpBody}
  </section>

  <section class="fgp-part">
    <p class="fgp-part-header"><span class="fgp-part-number">Part 3</span><span>Governance &amp; Sign-off</span></p>
    <div class="gov-section">
    <h2>Sign-off Record</h2>
    <div class="gov-stamp">${govStampCells}</div>

    <h2 style="margin-top:1.5rem">Governance Confirmations</h2>
    <ul class="gov-checklist">${govChecks}</ul>

    ${gov.publicationNotes ? `<h2 style="margin-top:1.5rem">Publication Notes</h2><p class="gov-notes">${esc(gov.publicationNotes).replace(/\n/g, "<br>")}</p>` : ""}
    </div>
  </section>

  <footer class="gov-footer">Full Governance Pack &middot; ${name} &middot; v${esc(id.version || "1.0")}</footer>
  </main>

</body>
</html>`;
}
