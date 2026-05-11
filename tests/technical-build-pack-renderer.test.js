import { describe, expect, it } from "vitest";
import { renderTechnicalBuildPack } from "../src/js/render/technical-build-pack-renderer.js";
import { enterpriseTemplate } from "../src/js/state/template.js";

describe("renderTechnicalBuildPack", () => {
  it("renders without crashing when bmcConfig is absent", () => {
    const state = { ...enterpriseTemplate, bmcConfig: undefined };
    const html = renderTechnicalBuildPack(state, { assetBase: "/" });
    expect(html).toContain("DEVELOPER EXPORT");
    expect(html).toContain("Implementation mode not set");
  });

  it("renders DWP section when implementationMode is dwp", () => {
    const html = renderTechnicalBuildPack(enterpriseTemplate, { assetBase: "/" });
    expect(html).toContain("DWP Catalog Configuration");
    expect(html).toContain("IT Infrastructure &gt; Server Provisioning");
  });

  it("escapes XSS payloads in user-controlled fields", () => {
    const xss = '<script>alert(1)</script>';
    const state = {
      ...enterpriseTemplate,
      identity: { ...enterpriseTemplate.identity, name: xss },
      bmcConfig: {
        implementationMode: "dwp",
        dwp: { catalogProfile: xss, questionnaireMapping: "", workflowMapping: "", processInputs: "", connectorProvider: "", entitlementRules: "", publishLifecycle: "" },
        srm: { srdName: "", srdType: "Standard", requestCatalogManager: "", aotMapping: "", pdtMapping: "", fulfillmentObject: "", approvalRules: "", slmServiceTarget: "", businessServiceCI: "", deploymentLifecycle: "" },
        deploymentChecklist: "",
        localizationNotes: ""
      }
    };
    const html = renderTechnicalBuildPack(state, { assetBase: "/" });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("renders SRM section when implementationMode is srm", () => {
    const state = {
      ...enterpriseTemplate,
      bmcConfig: {
        ...enterpriseTemplate.bmcConfig,
        implementationMode: "srm"
      }
    };
    const html = renderTechnicalBuildPack(state, { assetBase: "/" });
    expect(html).toContain("SRM / SRD Configuration");
  });
});
