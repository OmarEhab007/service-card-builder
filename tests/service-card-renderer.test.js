import { describe, expect, it } from "vitest";
import { renderServiceCard } from "../src/js/render/service-card-renderer.js";
import { enterpriseTemplate } from "../src/js/state/template.js";

describe("renderServiceCard", () => {
  it("exports a full governance pack with three named parts", () => {
    const html = renderServiceCard(enterpriseTemplate, { assetBase: "/" });

    expect(html).toContain("Part 1");
    expect(html).toContain("Business Service Card");
    expect(html).toContain("Part 2");
    expect(html).toContain("Technical BMC Build Pack");
    expect(html).toContain("Part 3");
    expect(html).toContain("Governance");
  });

  it("embeds business card and technical build pack content and governance sign-off", () => {
    const html = renderServiceCard(enterpriseTemplate, { assetBase: "/" });

    // Business card content
    expect(html).toContain("Server Request");
    expect(html).toContain("Business Description");

    // Technical build pack content
    expect(html).toContain("5BD");

    // Governance section
    expect(html).toContain("Sign-off Record");
    expect(html).toContain("Governance Confirmations");
  });
});
