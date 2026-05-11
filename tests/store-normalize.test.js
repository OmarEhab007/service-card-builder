import { describe, expect, it } from "vitest";

// normalizeBmcConfig is not exported from store.js (it's internal), so we
// test it indirectly via normalizeStateShape by using replaceState + getState.
// We import store internals through the module entry point.
import { replaceState, getState } from "../src/js/state/store.js";

describe("normalizeBmcConfig (via normalizeStateShape)", () => {
  it("fills full defaults when bmcConfig is absent", () => {
    replaceState({ identity: { name: "X" } });
    const state = getState();
    expect(state.bmcConfig).toBeDefined();
    expect(state.bmcConfig.implementationMode).toBe("none");
    expect(state.bmcConfig.dwp).toBeDefined();
    expect(state.bmcConfig.dwp.catalogProfile).toBe("");
    expect(state.bmcConfig.srm).toBeDefined();
    expect(state.bmcConfig.srm.srdType).toBe("Standard");
  });

  it("merges partial bmcConfig with defaults", () => {
    replaceState({
      identity: { name: "Y" },
      bmcConfig: { implementationMode: "srm" }
    });
    const state = getState();
    expect(state.bmcConfig.implementationMode).toBe("srm");
    expect(state.bmcConfig.dwp.catalogProfile).toBe("");
    expect(state.bmcConfig.srm.srdType).toBe("Standard");
  });

  it("preserves provided field values and fills missing ones", () => {
    replaceState({
      identity: { name: "Z" },
      bmcConfig: {
        implementationMode: "dwp",
        dwp: { catalogProfile: "My Profile" },
        srm: {}
      }
    });
    const state = getState();
    expect(state.bmcConfig.dwp.catalogProfile).toBe("My Profile");
    expect(state.bmcConfig.dwp.questionnaireMapping).toBe("");
    expect(state.bmcConfig.srm.srdType).toBe("Standard");
  });
});
