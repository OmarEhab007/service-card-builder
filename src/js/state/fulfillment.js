export const FULFILLMENT_DEFAULT = {
  mode: "approval-heavy",
  managerApproval: true,
  businessApproval: true,
  architectureApproval: true,
  securityReview: false,
  networkProvisioning: true,
  monitoringForProduction: true,
  baseProvisioningDays: 2,
  approvalDays: 1,
  supportGroup: "System Team"
};

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function normalizeFulfillmentConfig(config) {
  const next = { ...(config || {}) };
  return {
    mode: typeof next.mode === "string" && next.mode.trim() ? next.mode : FULFILLMENT_DEFAULT.mode,
    managerApproval: next.managerApproval !== false,
    businessApproval: next.businessApproval !== false,
    architectureApproval: next.architectureApproval !== false,
    securityReview: next.securityReview === true,
    networkProvisioning: next.networkProvisioning !== false,
    monitoringForProduction: next.monitoringForProduction !== false,
    baseProvisioningDays: parsePositiveInt(next.baseProvisioningDays, FULFILLMENT_DEFAULT.baseProvisioningDays),
    approvalDays: parsePositiveInt(next.approvalDays, FULFILLMENT_DEFAULT.approvalDays),
    supportGroup:
      typeof next.supportGroup === "string" && next.supportGroup.trim()
        ? next.supportGroup.trim()
        : FULFILLMENT_DEFAULT.supportGroup
  };
}

function createWorkflowStep(step, actor, type, duration, condition = "-") {
  return { step, actor, type, duration, condition };
}

function isLikelyProductionField(field) {
  const text = `${field?.nameEn || ""} ${field?.values || ""}`.toLowerCase();
  return text.includes("production");
}

function createEmptyRaciRow(step, roles) {
  const row = { step };
  roles.forEach((role) => {
    row[role.key] = "-";
  });
  return row;
}

export function deriveFulfillmentArtifacts(state) {
  const cfg = normalizeFulfillmentConfig(state?.fulfillment);
  const approvals = [];
  const workflow = [];
  const support = Array.isArray(state?.support) ? [...state.support] : [];
  const actors = Array.isArray(state?.actors) ? [...state.actors] : [];
  const roles = Array.isArray(state?.raciConfig?.roles) && state.raciConfig.roles.length ? state.raciConfig.roles : [];

  workflow.push(
    createWorkflowStep(
      "Fill out the form and submit the request",
      "Requester",
      "Start",
      "Same Day"
    )
  );

  if (cfg.managerApproval) {
    approvals.push("manager");
    workflow.push(
      createWorkflowStep(
        "Manager Approval",
        "Requester Manager",
        "Decision",
        `${cfg.approvalDays} Business Day${cfg.approvalDays > 1 ? "s" : ""}`
      )
    );
  }
  if (cfg.businessApproval) {
    approvals.push("business");
    workflow.push(
      createWorkflowStep(
        "Business Owner Approval",
        "Business Owner",
        "Decision",
        `${cfg.approvalDays} Business Day${cfg.approvalDays > 1 ? "s" : ""}`
      )
    );
  }
  if (cfg.architectureApproval) {
    approvals.push("architecture");
    workflow.push(
      createWorkflowStep(
        "Enterprise Architecture Approval",
        "EA Team",
        "Decision",
        `${cfg.approvalDays} Business Day${cfg.approvalDays > 1 ? "s" : ""}`
      )
    );
  }
  if (cfg.securityReview) {
    approvals.push("security");
    workflow.push(
      createWorkflowStep(
        "Security Review",
        "Security Team",
        "Decision",
        `${cfg.approvalDays} Business Day${cfg.approvalDays > 1 ? "s" : ""}`
      )
    );
  }

  const provisioningActor = cfg.networkProvisioning ? "System / Network Team" : "System Team";
  workflow.push(
    createWorkflowStep(
      "Server Provisioning",
      provisioningActor,
      "Action",
      `${cfg.baseProvisioningDays} Business Day${cfg.baseProvisioningDays > 1 ? "s" : ""}`
    )
  );

  if (cfg.monitoringForProduction) {
    const prodMentioned = (state?.fields || []).some(isLikelyProductionField);
    workflow.push(
      createWorkflowStep(
        "Monitoring Setup",
        "Monitoring Team",
        "Action",
        "1 Business Day",
        prodMentioned ? "Production Servers Only" : "-"
      )
    );
  }

  const roleKeys = roles.map((r) => r.key);
  const defaultRaci = (step) => {
    const row = createEmptyRaciRow(step, roles);
    if (roleKeys[0]) row[roleKeys[0]] = "I";
    if (roleKeys[roleKeys.length - 1]) row[roleKeys[roleKeys.length - 1]] = "A/R";
    return row;
  };
  const raci = workflow.map((row, idx) => {
    if (idx === 0) {
      const first = createEmptyRaciRow(row.step, roles);
      if (roleKeys[0]) first[roleKeys[0]] = "A/R";
      if (roleKeys[1]) first[roleKeys[1]] = "I";
      return first;
    }
    if (row.step.includes("Manager")) {
      const manager = createEmptyRaciRow(row.step, roles);
      if (roleKeys[0]) manager[roleKeys[0]] = "I";
      if (roleKeys[2] || roleKeys[1]) manager[roleKeys[2] || roleKeys[1]] = "A/R";
      return manager;
    }
    if (row.step.includes("Business Owner")) {
      const business = createEmptyRaciRow(row.step, roles);
      if (roleKeys[0]) business[roleKeys[0]] = "I";
      if (roleKeys[1]) business[roleKeys[1]] = "A/R";
      return business;
    }
    if (row.step.includes("Architecture") || row.step.includes("Security")) {
      return defaultRaci(row.step);
    }
    return defaultRaci(row.step);
  });

  const approvalCount = approvals.length;
  const totalDurationDays = approvalCount * cfg.approvalDays + cfg.baseProvisioningDays + (cfg.monitoringForProduction ? 1 : 0);

  const slaPatch = {
    supportGroup: cfg.supportGroup,
    controls:
      approvalCount > 0
        ? `${approvalCount} approval gate${approvalCount > 1 ? "s" : ""} before fulfillment`
        : "Straight-through fulfillment (no explicit approvals)",
    duration: `${totalDurationDays}BD`,
    prerequisites:
      cfg.mode === "approval-heavy"
        ? "Validated capacity, ownership, and approvals"
        : cfg.mode === "balanced"
          ? "Validated ownership and minimum technical checks"
          : "Basic request information completed"
  };

  const supportGroupExists = support.some((g) => g?.supportGroup === cfg.supportGroup);
  if (!supportGroupExists) {
    support.push({ supportGroup: cfg.supportGroup, names: cfg.supportGroup, emails: "" });
  }

  const requiredActors = [
    { name: "Requester", role: "Service Requestor", department: "Business Units", email: "" },
    { name: "Requester Manager", role: "Approval Owner", department: "Business Units", email: "" },
    { name: "Business Owner", role: "Business Approver", department: "Business", email: "" },
    { name: "EA Team", role: "Architecture Approver", department: "IT Architecture", email: "" },
    { name: "Security Team", role: "Security Approver", department: "IT Security", email: "" },
    { name: "System Team", role: "Provisioning Team", department: "IT Infrastructure", email: "" },
    { name: "Network Team", role: "Network Provisioning", department: "IT Infrastructure", email: "" },
    { name: "Monitoring Team", role: "Monitoring Enablement", department: "IT Operations", email: "" }
  ];
  const actorNames = new Set(actors.map((a) => (a?.name || "").trim()).filter(Boolean));
  requiredActors.forEach((candidate) => {
    if (!actorNames.has(candidate.name)) {
      actors.push(candidate);
    }
  });

  return { workflow, raci, slaPatch, support, actors, summary: { approvalCount, totalDurationDays, mode: cfg.mode } };
}
