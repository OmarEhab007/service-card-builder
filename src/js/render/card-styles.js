/**
 * Service card output styles — extracted from service-card-renderer.js (B-4).
 * Returns the full CSS string for the self-contained HTML output.
 *
 * @param {{ fontStack: string, fontArStack: string, bgUrl: string, visualsUrl: string, brand: { ink: string, muted: string, border: string, surface: string, primary: string, primaryDark: string, accent: string } }} params
 * @returns {string}
 */
export function buildCardStyles({ fontStack, fontArStack, bgUrl, visualsUrl, brand }) {
  return `
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
      font-family: ${fontStack};
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
    .hdr-banner-subtitle {
      margin: 0.28rem 0 0;
      color: rgba(255, 255, 255, 0.78);
      font-size: 0.82rem;
      font-weight: 600;
      line-height: 1.4;
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
      font-family: ${fontArStack};
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
    .meta-item { margin: 0; }
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
    .sec .card + .card { margin-top: 0.85rem; }
    .sec h2 {
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--primary);
      margin: 0 0 0.9rem;
    }
    .sec--summary {
      background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(135px, 1fr));
      gap: 0.65rem;
      margin: 0;
    }
    .summary-card {
      margin: 0;
      padding: 0.85rem 0.95rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: #fff;
      box-shadow: var(--shadow);
    }
    .summary-card dt {
      margin: 0 0 0.25rem;
      color: var(--muted);
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .summary-card dd {
      margin: 0;
      color: var(--ink);
      font-size: 1.02rem;
      font-weight: 800;
      line-height: 1.25;
      word-break: break-word;
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
    .prose + .prose { margin-top: 0.85rem; }
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
    .card:not([dir="rtl"]) { border-left: 3px solid var(--accent); }
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
    table.data th, table.data td {
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
    table.data tbody tr:nth-child(even) td { background: #fafbfc; }
    table.data tbody tr:last-child td { border-bottom: none; }
    table.data td.empty, table.data .muted {
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
    table.workflow-rich { font-size: 0.8rem; }
    table.workflow-rich tbody tr:nth-child(even) td { background: transparent; }
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
    .outcome--start { border-color: #bbf7d0; background: #f7fef9; color: #166534; }
    .outcome--decision { border-color: #fde68a; background: #fffbeb; color: #a16207; }
    .outcome--action { border-color: #bfdbfe; background: #f8fafc; color: #1d4ed8; }
    .outcome--end { border-color: #e2e8f0; background: #f8fafc; color: #64748b; }
    .outcome--neutral { border-color: #e2e8f0; background: #f8fafc; color: #475569; }
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
    .resp-card li { margin-bottom: 0.25rem; }
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

      html { font-size: 9.75pt; }

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

      .hdr-banner { break-after: avoid; page-break-after: avoid; }
      .hdr-ar, .meta-grid { break-inside: avoid; page-break-inside: avoid; }
      .sec h2, .sec-subtitle { break-after: avoid; page-break-after: avoid; }
      .workflow-legend, .flow-path-wrap { break-inside: avoid; page-break-inside: avoid; }
      .resp-grid { break-inside: avoid; page-break-inside: avoid; }

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

      table.data thead { display: table-header-group; }

      table.data th, table.data td {
        border: 0.35pt solid #64748b !important;
        padding: 4px 5px !important;
        vertical-align: top !important;
      }

      table.data th {
        background: linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%) !important;
        color: #1e293b !important;
        font-size: 7.25pt !important;
      }

      table.data:not(.workflow-rich) tbody tr:nth-child(even) td { background: #f8fafc !important; }
      table.data tr { break-inside: avoid; page-break-inside: avoid; }
      table.workflow-rich tbody tr { break-inside: avoid; page-break-inside: avoid; }

      table.workflow-rich .wf-actor, table.workflow-rich .wf-num {
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

      .status-pill, .type-chip, .outcome-pill, .flow-pill,
      .legend-chip, .step-disc, .resp-card, .actor-dot {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .prose { orphans: 3; widows: 3; }
    }
  `;
}
