import { describe, expect, it } from "vitest";
import { computeReadiness, getCriticalGaps } from "../src/js/domain/readiness.js";
import { enterpriseTemplate } from "../src/js/state/template.js";

describe("computeReadiness", () => {
  it("returns all five checklist sections", () => {
    const r = computeReadiness(enterpriseTemplate);
    expect(r).toHaveProperty("business");
    expect(r).toHaveProperty("technical");
    expect(r).toHaveProperty("governance");
    expect(r).toHaveProperty("uat");
    expect(r).toHaveProperty("publication");
  });

  it("fully passes business checklist on the enterprise template", () => {
    const { business } = computeReadiness(enterpriseTemplate);
    const failing = business.items.filter((i) => !i.ok).map((i) => i.label);
    expect(failing).toEqual([]);
    expect(business.passed).toBe(business.total);
  });

  it("fails business critical items when identity fields are missing", () => {
    const state = { ...enterpriseTemplate, identity: { name: "", description: "" } };
    const { business } = computeReadiness(state);
    const criticalFails = business.items.filter((i) => i.critical && !i.ok);
    expect(criticalFails.length).toBeGreaterThan(0);
  });

  it("marks implementation mode as critical gap when set to none", () => {
    const state = {
      ...enterpriseTemplate,
      bmcConfig: { ...enterpriseTemplate.bmcConfig, implementationMode: "none" }
    };
    const { technical } = computeReadiness(state);
    const modeItem = technical.items.find((i) => i.label.includes("Implementation mode"));
    expect(modeItem.ok).toBe(false);
    expect(modeItem.critical).toBe(true);
  });

  it("includes DWP-specific items only when mode is dwp or hybrid", () => {
    const noDwp = { ...enterpriseTemplate, bmcConfig: { ...enterpriseTemplate.bmcConfig, implementationMode: "srm" } };
    const { technical: techSrm } = computeReadiness(noDwp);
    expect(techSrm.items.some((i) => i.label.startsWith("DWP:"))).toBe(false);

    const { technical: techDwp } = computeReadiness(enterpriseTemplate);
    expect(techDwp.items.some((i) => i.label.startsWith("DWP:"))).toBe(true);
  });

  it("fully passes governance checklist on the enterprise template", () => {
    const { governance } = computeReadiness(enterpriseTemplate);
    const failing = governance.items.filter((i) => !i.ok).map((i) => i.label);
    expect(failing).toEqual([]);
  });

  it("fails publication when sign-off fields are empty", () => {
    const state = {
      ...enterpriseTemplate,
      governance: { ...enterpriseTemplate.governance, preparedBy: "", reviewedBy: "", approvedBy: "" }
    };
    const { publication } = computeReadiness(state);
    const signoffItem = publication.items.find((i) => i.label.includes("sign-off"));
    expect(signoffItem.ok).toBe(false);
  });

  it("passes UAT checklist when template has start/decision/action steps", () => {
    const { uat } = computeReadiness(enterpriseTemplate);
    const failing = uat.items.filter((i) => !i.ok).map((i) => i.label);
    expect(failing).toEqual([]);
  });
});

describe("getCriticalGaps", () => {
  it("returns empty when enterprise template is complete", () => {
    expect(getCriticalGaps(enterpriseTemplate)).toEqual([]);
  });

  it("returns critical gap labels when name and description are missing", () => {
    const state = { ...enterpriseTemplate, identity: { name: "", description: "", status: "Active" } };
    const gaps = getCriticalGaps(state);
    expect(gaps.some((g) => g.includes("Service name"))).toBe(true);
    expect(gaps.some((g) => g.includes("description"))).toBe(true);
  });
});
