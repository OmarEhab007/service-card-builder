import Ajv from "ajv";
import { schema } from "../state/schema.js";

export function validateState(state) {
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  const ok = validate(state);
  return {
    ok,
    errors: ok
      ? []
      : validate.errors.map((err) => `${err.instancePath || "root"} ${err.message}`)
  };
}
