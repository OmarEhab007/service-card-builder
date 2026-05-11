import { describe, expect, it } from "vitest";
import { renderServiceCard } from "../src/js/render/service-card-renderer.js";
import { enterpriseTemplate } from "../src/js/state/template.js";

describe("renderServiceCard", () => {
  it("exports a text-first document header without logo markup", () => {
    const html = renderServiceCard(enterpriseTemplate, { assetBase: "/" });

    expect(html).not.toContain('alt="Damee Logo"');
    expect(html).not.toContain("logo--banner");
    expect(html).toContain("Service Card");
    expect(html).toContain("Server Request");
  });

  it("renders an executive summary for SLA and KPI scanning", () => {
    const html = renderServiceCard(enterpriseTemplate, { assetBase: "/" });

    expect(html).toContain("Document summary");
    expect(html).toContain("SLA duration");
    expect(html).toContain("Support group");
    expect(html).toContain("KPI count");
    expect(html).toContain("5BD");
  });
});
