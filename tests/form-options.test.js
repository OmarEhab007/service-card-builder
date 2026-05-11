import { describe, expect, it } from "vitest";
import {
  ACTOR_ROLE_OPTIONS,
  DURATION_OPTIONS,
  IDENTITY_STATUS_OPTIONS,
  SLA_CONTROL_OPTIONS,
  SLA_REQUESTER_OPTIONS,
  WORKFLOW_TYPE_OPTIONS
} from "../src/js/domain/form-options.js";

describe("form option catalogs", () => {
  it("provides controlled values for common service card fields", () => {
    expect(IDENTITY_STATUS_OPTIONS).toEqual(["Draft", "Active", "Deprecated", "Retired"]);
    expect(WORKFLOW_TYPE_OPTIONS).toEqual(["Start", "Decision", "Action", "End"]);
    expect(DURATION_OPTIONS).toContain("Same Day");
    expect(DURATION_OPTIONS).toContain("5BD");
    expect(ACTOR_ROLE_OPTIONS).toContain("Service Requestor");
    expect(ACTOR_ROLE_OPTIONS).toContain("Approval Owner");
  });

  it("provides SLA presets for requester and control fields", () => {
    expect(SLA_REQUESTER_OPTIONS).toContain("IT Users");
    expect(SLA_REQUESTER_OPTIONS).toContain("Business Users");
    expect(SLA_CONTROL_OPTIONS).toContain("Multiple Approvals Required");
    expect(SLA_CONTROL_OPTIONS).toContain("Standard Fulfillment");
  });
});
