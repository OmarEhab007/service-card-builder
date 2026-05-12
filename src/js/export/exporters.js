import { renderServiceCard } from "../render/service-card-renderer.js";
import { renderBusinessCard } from "../render/business-card-renderer.js";
import { renderTechnicalBuildPack } from "../render/technical-build-pack-renderer.js";
import { renderMarkdown } from "../render/markdown-renderer.js";
import { downloadFile } from "../utils/dom.js";
import { buildSelfContainedRenderOptions } from "./portable-assets.js";

function whenPrintDocumentReady(doc) {
  const fontsReady = doc.fonts && typeof doc.fonts.ready !== "undefined" ? doc.fonts.ready.catch(() => undefined) : Promise.resolve();

  const imagesReady = Promise.all(
    [...doc.images].map((img) =>
      img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise((resolve) => {
            const done = () => resolve();
            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", done, { once: true });
          })
    )
  );

  return Promise.all([fontsReady, imagesReady]);
}

function exportFileBaseName(value, fallback = "Service_Card") {
  const normalized = String(value || fallback)
    .trim()
    // eslint-disable-next-line no-control-regex
    .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^\.+|\.+$/g, "");

  return normalized || fallback;
}

/** Fallback when embedding fails; external decorative assets may break if the file is moved. */
async function renderMinimalPortable(state) {
  return renderServiceCard(state, { assetBase: "./" });
}

async function renderMinimalPortableBusiness(state) {
  return renderBusinessCard(state, { assetBase: "./" });
}

async function renderMinimalPortableTechPack(state) {
  return renderTechnicalBuildPack(state, { assetBase: "./" });
}

export async function exportHtml(state) {
  let html;
  try {
    const bundle = await buildSelfContainedRenderOptions();
    html = renderServiceCard(state, bundle);
  } catch (e) {
    console.warn("Self-contained embed failed, using partial HTML:", e);
    html = await renderMinimalPortable(state);
  }
  const name = exportFileBaseName(state.identity?.name, "Service_Card");
  downloadFile(html, `${name}_Full.html`, "text/html");
}

export async function exportBusinessCardHtml(state) {
  let html;
  try {
    const bundle = await buildSelfContainedRenderOptions();
    html = renderBusinessCard(state, bundle);
  } catch (e) {
    console.warn("Self-contained embed failed, using partial HTML:", e);
    html = await renderMinimalPortableBusiness(state);
  }
  const name = exportFileBaseName(state.identity?.name, "Service_Card");
  downloadFile(html, `${name}_Business_Card.html`, "text/html");
}

export function exportMarkdown(state) {
  const md = renderMarkdown(state);
  const name = exportFileBaseName(state.identity?.name, "Service_Card");
  downloadFile(md, `${name}.md`, "text/markdown");
}

export async function exportTechBuildPackHtml(state) {
  let html;
  try {
    const bundle = await buildSelfContainedRenderOptions();
    html = renderTechnicalBuildPack(state, bundle);
  } catch (e) {
    console.warn("Self-contained embed failed, using partial HTML:", e);
    html = await renderMinimalPortableTechPack(state);
  }
  const name = exportFileBaseName(state.identity?.name, "Service");
  downloadFile(html, `${name}_BMC_Build_Pack.html`, "text/html");
}

/** @param {"business"|"tech"|"full"} [exportType] */
export async function printPdf(state, exportType = "business") {
  // Open popup synchronously in the click stack so browsers don't block it.
  const popup = window.open("", "_blank");
  if (!popup) {
    alert("Please allow pop-ups to print or save as PDF.");
    return;
  }

  popup.document.open();
  popup.document.write(
    `<!DOCTYPE html><html><head><title>Preparing print...</title></head><body style="font-family: sans-serif; padding: 16px;">Preparing printable document...</body></html>`
  );
  popup.document.close();

  let html;
  try {
    const bundle = await buildSelfContainedRenderOptions();
    if (exportType === "tech") html = renderTechnicalBuildPack(state, bundle);
    else if (exportType === "full") html = renderServiceCard(state, bundle);
    else html = renderBusinessCard(state, bundle);
  } catch (e) {
    console.warn("Self-contained embed failed for print:", e);
    if (exportType === "tech") html = await renderMinimalPortableTechPack(state);
    else if (exportType === "full") html = await renderMinimalPortable(state);
    else html = await renderMinimalPortableBusiness(state);
  }

  popup.document.open();
  popup.document.write(html);
  popup.document.close();

  let printStarted = false;
  const runPrint = () => {
    if (printStarted) return;
    printStarted = true;
    requestAnimationFrame(() => {
      setTimeout(() => {
        whenPrintDocumentReady(popup.document).then(() => {
          popup.focus();
          popup.print();
        });
      }, 80);
    });
  };

  if (popup.document.readyState === "complete") {
    runPrint();
  } else {
    popup.addEventListener("load", runPrint, { once: true });
    setTimeout(runPrint, 400);
  }
}
