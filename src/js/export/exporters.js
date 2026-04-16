import { renderServiceCard } from "../render/service-card-renderer.js";
import { renderMarkdown } from "../render/markdown-renderer.js";
import { downloadFile } from "../utils/dom.js";
import { BUNDLED_FAV_LOGO_URL, buildSelfContainedRenderOptions, getAppAssetBase } from "./portable-assets.js";

function appAssetBase() {
  return getAppAssetBase();
}

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

/** Fallback when embedding fails: still inline logo so the banner shows; external links may break if the file is moved. */
async function renderMinimalPortable(state) {
  const base = appAssetBase();
  let inlineLogo = null;
  let inlineLogoDataUrl = null;
  try {
    const res = await fetch(BUNDLED_FAV_LOGO_URL, { cache: "force-cache" });
    if (res.ok) inlineLogo = await res.text();
  } catch {
    /* ignore */
  }
  if (!inlineLogo) {
    try {
      const res = await fetch(`${base}assets/safari-pinned-tab.svg`, { cache: "force-cache" });
      if (res.ok) inlineLogo = await res.text();
    } catch {
      /* ignore */
    }
  }
  if (!inlineLogo) {
    try {
      const res = await fetch(`${base}logo.png`, { cache: "force-cache" });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let binary = "";
        for (let i = 0; i < bytes.length; i += 0x8000) {
          binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
        }
        inlineLogoDataUrl = `data:image/png;base64,${btoa(binary)}`;
      }
    } catch {
      /* ignore */
    }
  }
  return renderServiceCard(state, {
    assetBase: "./",
    inlineLogoSvg: inlineLogo || undefined,
    inlineLogoDataUrl: inlineLogoDataUrl || undefined
  });
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
  downloadFile(html, `${name}.html`, "text/html");
}

export function exportMarkdown(state) {
  const md = renderMarkdown(state);
  const name = (state.identity.name || "Service_Card").replace(/\s+/g, "_");
  downloadFile(md, `${name}.md`, "text/markdown");
}

export async function printPdf(state) {
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
  try {
    const bundle = await buildSelfContainedRenderOptions();
    html = renderServiceCard(state, bundle);
  } catch (e) {
    console.warn("Self-contained embed failed for print:", e);
    html = await renderMinimalPortable(state);
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
