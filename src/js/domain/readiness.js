/**
 * Readiness checklists — pure functions, no DOM or state side effects.
 * Each function returns an array of { label, ok, critical } items.
 * computeReadiness() aggregates all five checklists with scores.
 */

function filled(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function businessChecklist(state) {
  const id = state.identity || {};
  const sla = state.sla || {};
  const wf = state.workflow || [];
  const actors = state.actors || [];

  return [
    { label: "Service name (EN) defined", ok: filled(id.name), critical: true },
    { label: "Service description (EN) defined", ok: filled(id.description), critical: true },
    { label: "Business purpose & value filled", ok: filled(id.businessPurpose), critical: true },
    { label: "Business owner identified", ok: filled(id.businessOwner), critical: true },
    { label: "Target requesters defined", ok: filled(id.targetRequesters), critical: true },
    { label: "Eligibility / who can request filled", ok: filled(id.eligibility), critical: false },
    { label: "Service owner defined", ok: filled(id.owner), critical: true },
    { label: "Review date set", ok: filled(id.reviewDate), critical: false },
    { label: "At least one actor defined", ok: actors.length > 0, critical: true },
    { label: "Workflow steps defined", ok: wf.length > 0, critical: true },
    { label: "SLA duration set", ok: filled(sla.duration), critical: true },
    { label: "Support group defined", ok: filled(sla.supportGroup), critical: true }
  ];
}

function technicalChecklist(state) {
  const bmc = state.bmcConfig || {};
  const mode = bmc.implementationMode || "none";
  const dwp = bmc.dwp || {};
  const srm = bmc.srm || {};
  const fields = state.fields || [];
  const isDwp = mode === "dwp" || mode === "hybrid";
  const isSrm = mode === "srm" || mode === "hybrid";

  const items = [
    { label: "Implementation mode set", ok: mode !== "none", critical: true }
  ];

  if (isDwp) {
    items.push(
      { label: "DWP: Catalog profile defined", ok: filled(dwp.catalogProfile), critical: true },
      { label: "DWP: Questionnaire mapping defined", ok: filled(dwp.questionnaireMapping), critical: false },
      { label: "DWP: Workflow mapping defined", ok: filled(dwp.workflowMapping), critical: false },
      { label: "DWP: Entitlement rules defined", ok: filled(dwp.entitlementRules), critical: false }
    );
  }

  if (isSrm) {
    items.push(
      { label: "SRM: SRD name defined", ok: filled(srm.srdName), critical: true },
      { label: "SRM: AOT mapping defined", ok: filled(srm.aotMapping), critical: false },
      { label: "SRM: PDT mapping defined", ok: filled(srm.pdtMapping), critical: false },
      { label: "SRM: SLM service target defined", ok: filled(srm.slmServiceTarget), critical: false }
    );
  }

  const mappedFields = fields.filter((f) => filled(f.bmcVariable));
  items.push(
    { label: "Form fields defined", ok: fields.length > 0, critical: false },
    { label: "BMC variables mapped on form fields", ok: mode !== "none" && mappedFields.length > 0, critical: false },
    { label: "Deployment checklist filled", ok: filled(bmc.deploymentChecklist), critical: false }
  );

  return items;
}

function governanceChecklist(state) {
  const id = state.identity || {};
  const kpis = state.kpis || [];
  const gov = state.governance || {};

  return [
    { label: "Service ID set", ok: filled(id.id), critical: false },
    { label: "Version defined", ok: filled(id.version), critical: false },
    { label: "Status is Active", ok: id.status === "Active", critical: false },
    { label: "Review date set", ok: filled(id.reviewDate), critical: false },
    { label: "KPIs defined", ok: kpis.length > 0, critical: false },
    { label: "KPI targets set", ok: kpis.length > 0 && kpis.every((k) => filled(k.target)), critical: false },
    { label: "Business owner sign-off recorded", ok: !!gov.businessOwnerSignedOff, critical: false },
    { label: "ITIL alignment confirmed", ok: !!gov.itilAligned, critical: false },
    { label: "Prepared by filled", ok: filled(gov.preparedBy), critical: false },
    { label: "Reviewed by filled", ok: filled(gov.reviewedBy), critical: false },
    { label: "Approved by filled", ok: filled(gov.approvedBy), critical: false }
  ];
}

function uatChecklist(state) {
  const wf = state.workflow || [];
  const fields = state.fields || [];
  const kpis = state.kpis || [];
  const support = state.support || [];
  const sla = state.sla || {};

  const types = wf.map((s) => (s.type || "").toLowerCase());

  return [
    { label: "Workflow has a Start step", ok: types.includes("start"), critical: false },
    { label: "Workflow has at least one Decision/Approval step", ok: types.includes("decision"), critical: false },
    { label: "Workflow has at least one Action/Fulfillment step", ok: types.includes("action"), critical: false },
    { label: "Mandatory form fields defined", ok: fields.some((f) => f.mandatory === "X"), critical: false },
    { label: "SLA target/duration defined", ok: filled(sla.duration), critical: false },
    { label: "Support group contacts defined", ok: support.length > 0, critical: false },
    { label: "KPI measurements defined", ok: kpis.length > 0, critical: false },
    { label: "KPI owners assigned", ok: kpis.length > 0 && kpis.every((k) => filled(k.owner)), critical: false }
  ];
}

function publicationChecklist(state) {
  const id = state.identity || {};
  const gov = state.governance || {};
  const busItems = businessChecklist(state);
  const allBusinessCriticalPass = busItems.filter((i) => i.critical).every((i) => i.ok);

  return [
    { label: "All critical business fields complete", ok: allBusinessCriticalPass, critical: true },
    { label: "Service status is Active", ok: id.status === "Active", critical: false },
    { label: "Arabic service name provided", ok: filled(id.nameAr), critical: false },
    { label: "All sign-off fields filled", ok: filled(gov.preparedBy) && filled(gov.reviewedBy) && filled(gov.approvedBy), critical: false },
    { label: "UAT completed", ok: !!gov.uatCompleted, critical: false },
    { label: "Business owner signed off", ok: !!gov.businessOwnerSignedOff, critical: false }
  ];
}

function scoreItems(items) {
  return { items, passed: items.filter((i) => i.ok).length, total: items.length };
}

/**
 * Compute all five readiness checklists from state.
 * @returns {{ business, technical, governance, uat, publication }}
 *          Each section: { items: [{label, ok, critical}], passed, total }
 */
export function computeReadiness(state) {
  return {
    business: scoreItems(businessChecklist(state)),
    technical: scoreItems(technicalChecklist(state)),
    governance: scoreItems(governanceChecklist(state)),
    uat: scoreItems(uatChecklist(state)),
    publication: scoreItems(publicationChecklist(state))
  };
}

/** Returns only the critical items that are not yet complete. Used for export warnings. */
export function getCriticalGaps(state) {
  const all = [
    ...businessChecklist(state),
    ...technicalChecklist(state),
    ...publicationChecklist(state)
  ];
  return all.filter((i) => i.critical && !i.ok).map((i) => i.label);
}
