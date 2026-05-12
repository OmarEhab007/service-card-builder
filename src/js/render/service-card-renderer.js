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
    .fgp-part-header { background: #1e3a8a; color: #fff; font-size: .68rem; font-weight: 800; text-transform: uppercase; letter-spacing: .12em; padding: .5rem 1.5rem; margin: 0; font-family: "Segoe UI", system-ui, sans-serif; }
    .fgp-divider { page-break-before: always; border: none; border-top: 4px solid #1e40af; margin: 2rem 0 1.5rem; }
    .gov-section { max-width: 860px; margin: 0 auto; padding: 1.5rem 1.5rem 2.5rem; font-family: "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif; }
    .gov-section h2 { font-size: 1.05rem; font-weight: 700; color: #1e40af; border-bottom: 2px solid #e2e8f0; padding-bottom: .35rem; margin-bottom: 1rem; }
    .gov-stamp { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: .75rem; }
    .gov-stamp-cell { border: 1px solid #e2e8f0; border-radius: 6px; padding: .6rem .75rem; }
    .gov-stamp-cell dt { font-size: .68rem; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: #64748b; }
    .gov-stamp-cell dd { margin: 0; font-size: .85rem; color: #0f172a; min-height: 1.8rem; border-top: 1px solid #e2e8f0; margin-top: .4rem; padding-top: .3rem; }
    .gov-checklist { list-style: none; margin: .5rem 0 0; padding: 0; }
    .gov-checklist li { padding: .35rem 0; font-size: .9rem; display: flex; align-items: center; gap: .6rem; }
    .gov-checklist li.is-checked { color: #0f172a; }
    .gov-checklist li.is-unchecked { color: #94a3b8; }
    .gov-checklist li.is-checked::before { content: "\\2611"; color: #2563eb; font-size: 1rem; }
    .gov-checklist li.is-unchecked::before { content: "\\2610"; font-size: 1rem; }
    .gov-notes { font-size: .9rem; color: #0f172a; line-height: 1.6; margin: .35rem 0 0; }
    .gov-footer { text-align: center; padding: 1.5rem; font-size: .72rem; color: #94a3b8; border-top: 1px solid #e2e8f0; margin-top: 2rem; font-family: "Segoe UI", system-ui, sans-serif; }
  </style>
</head>
<body>

  <p class="fgp-part-header">Part 1 &mdash; Business Service Card</p>
  ${bcBody}

  <hr class="fgp-divider">

  <p class="fgp-part-header">Part 2 &mdash; Technical BMC Build Pack</p>
  ${tbpBody}

  <hr class="fgp-divider">

  <p class="fgp-part-header">Part 3 &mdash; Governance &amp; Sign-off</p>
  <div class="gov-section">
    <h2>Sign-off Record</h2>
    <div class="gov-stamp">${govStampCells}</div>

    <h2 style="margin-top:1.5rem">Governance Confirmations</h2>
    <ul class="gov-checklist">${govChecks}</ul>

    ${gov.publicationNotes ? `<h2 style="margin-top:1.5rem">Publication Notes</h2><p class="gov-notes">${esc(gov.publicationNotes).replace(/\n/g, "<br>")}</p>` : ""}
  </div>

  <footer class="gov-footer">Full Governance Pack &middot; ${name} &middot; v${esc(id.version || "1.0")}</footer>

</body>
</html>`;
}
