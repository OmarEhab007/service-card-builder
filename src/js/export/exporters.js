import { renderServiceCard } from "../render/service-card-renderer.js";
import { renderBusinessCard } from "../render/business-card-renderer.js";
import { renderMarkdown } from "../render/markdown-renderer.js";
import { downloadFile } from "../utils/dom.js";
import { buildSelfContainedRenderOptions } from "./portable-assets.js";

function whenPrintDocumentReady(doc) {
  const fontsReady =
    doc.fonts && typeof doc.fonts.ready !== "undefined"
      ? doc.fonts.ready.catch(() => undefined)
      : Promise.resolve();

  const imagesReady = Promise.all(
    [...doc.images].map(
      (img) =>
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

/** Fallback when embedding fails; external decorative assets may break if the file is moved. */
async function renderMinimalPortable(state) {
  return renderServiceCard(state, { assetBase: "./" });
}

async function renderMinimalPortableBusiness(state) {
  return renderBusinessCard(state, { assetBase: "./" });
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
  const name = (state.identity.name || "Service_Card").replace(/\s+/g, "_");
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
  const name = (state.identity.name || "Service_Card").replace(/\s+/g, "_");
  downloadFile(html, `${name}_Business_Card.html`, "text/html");
}

export function exportMarkdown(state) {
  const md = renderMarkdown(state);
  const name = (state.identity.name || "Service_Card").replace(/\s+/g, "_");
  downloadFile(md, `${name}.md`, "text/markdown");
}

/** @param {"business"|"full"} [exportType] */
export async function printPdf(state, exportType = "business") {
  // Open popup synchronously in the click stack so browsers don't block it.
  const popup = window.open("", "_blank");
  if (!popup) {
    alert("Please allow pop-ups to print or save as PDF.");
    return;
  }

  popup.document.open();
  popup.document.write(`<!DOCTYPE html><html><head><title>Preparing print...</title></head><body style="font-family: sans-serif; padding: 16px;">Preparing printable document...</body></html>`);
  popup.document.close();

  let html;
  const isBusiness = exportType === "business";
  try {
    const bundle = await buildSelfContainedRenderOptions();
    html = isBusiness ? renderBusinessCard(state, bundle) : renderServiceCard(state, bundle);
  } catch (e) {
    console.warn("Self-contained embed failed for print:", e);
    html = isBusiness ? await renderMinimalPortableBusiness(state) : await renderMinimalPortable(state);
  }

  popup.document.open();
  popup.document.write(html);
  popup.document.close();

  const runPrint = () => {
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
