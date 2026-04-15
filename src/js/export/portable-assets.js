/**
 * Builds asset payloads so service-card HTML is self-contained: works when the file
 * is moved outside the project (no relative links to /public).
 */

export function getAppAssetBase() {
  const base = import.meta.env.BASE_URL || "/";
  return new URL(base, window.location.origin).href.replace(/\/?$/, "/");
}

async function fetchText(url) {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  return res.text();
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * Replace font file URLs in CSS with data: URLs (fetches each .otf from fonts folder).
 * Keeps existing `format("opentype")` after `url(...)` in @font-face rules.
 * @param {string} css
 * @param {string} fontsFolderUrl Absolute URL ending with /
 */
export async function inlineFontUrlsInCss(css, fontsFolderUrl) {
  const base = fontsFolderUrl.endsWith("/") ? fontsFolderUrl : `${fontsFolderUrl}/`;
  const re = /url\(\s*["']?([^"')]+)["']?\s*\)/g;
  /** @type {Array<{ full: string, abs: string }>} */
  const refs = [];
  let m;
  while ((m = re.exec(css)) !== null) {
    const full = m[0];
    const raw = m[1].trim();
    if (raw.startsWith("data:")) continue;
    const abs = new URL(raw, base).href;
    refs.push({ full, abs });
  }

  const dataUrlByAbs = new Map();
  const uniqueAbs = [...new Set(refs.map((r) => r.abs))];
  for (const abs of uniqueAbs) {
    const res = await fetch(abs, { cache: "force-cache" });
    if (!res.ok) throw new Error(`Font fetch failed: ${abs}`);
    const buf = await res.arrayBuffer();
    dataUrlByAbs.set(abs, `url(data:font/otf;base64,${arrayBufferToBase64(buf)})`);
  }

  let out = css;
  for (const { full, abs } of refs) {
    const replacement = dataUrlByAbs.get(abs);
    out = out.split(full).join(replacement);
  }
  return out;
}

/** Encode SVG as a CSS-safe data URL for background-image. */
export function svgTextToCssUrl(svgText) {
  const encoded = encodeURIComponent(String(svgText).trim())
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29");
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

/**
 * Options to pass to `renderServiceCard` so the document needs no files beside it.
 * @returns {Promise<{ assetBase: string, inlineLogoSvg: string, embeddedBackgroundDataUri: string, embeddedVisualsDataUri: string, embeddedFontCss: string }>}
 */
export async function buildSelfContainedRenderOptions() {
  const base = getAppAssetBase();

  const [logoSvg, bgSvg, visualsSvg, fontCssRaw] = await Promise.all([
    fetchText(`${base}Aassets/svg/logo-light_en.svg`),
    fetchText(`${base}Background.svg`),
    fetchText(`${base}Visuals.svg`),
    fetchText(`${base}fonts/loew-face.css`)
  ]);

  const embeddedFontCss = await inlineFontUrlsInCss(fontCssRaw, `${base}fonts/`);

  return {
    assetBase: "./",
    inlineLogoSvg: logoSvg,
    embeddedBackgroundDataUri: svgTextToCssUrl(bgSvg),
    embeddedVisualsDataUri: svgTextToCssUrl(visualsSvg),
    embeddedFontCss
  };
}
