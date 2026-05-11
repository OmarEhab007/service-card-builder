import Ajv from "ajv";
import { schema } from "../state/schema.js";

// Cache the compiled validator (V3 fix — avoid re-compiling on every call)
const ajv = new Ajv({ allErrors: true, strict: false });
const _validate = ajv.compile(schema);

/**
 * Validate state against the service-card JSON schema.
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateState(state) {
  const ok = _validate(state);
  return {
    ok,
    errors: ok
      ? []
      : _validate.errors.map((err) => `${err.instancePath || "root"} ${err.message}`)
  };
}

/**
 * Quick check for export readiness — validates required fields without full schema.
 * Returns a user-friendly list of warnings.
 * @returns {string[]}
 */
export function getExportWarnings(state) {
  const warnings = [];
  if (!state?.identity?.name?.trim()) {
    warnings.push("Service Name (EN) is empty.");
  }
  if (!state?.identity?.description?.trim()) {
    warnings.push("Service Description (EN) is empty.");
  }
  if (!Array.isArray(state?.workflow) || state.workflow.length === 0) {
    warnings.push("No workflow steps defined.");
  }
  if (!Array.isArray(state?.actors) || state.actors.length === 0) {
    warnings.push("No actors defined.");
  }
  const sla = state?.sla || {};
  if (!sla.service?.trim()) {
    warnings.push("SLA Service is empty.");
  }
  if (!sla.supportGroup?.trim()) {
    warnings.push("SLA Support Group is empty.");
  }
  return warnings;
}
