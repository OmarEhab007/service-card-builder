export const schema = {
  type: "object",
  required: ["fulfillment", "raciConfig", "identity", "actors", "workflow", "fields", "raci", "support", "sla", "slaParts", "kpis"],
  properties: {
    schemaVersion: { type: "string" },
    fulfillment: {
      type: "object",
      required: [
        "mode",
        "managerApproval",
        "businessApproval",
        "architectureApproval",
        "securityReview",
        "networkProvisioning",
        "monitoringForProduction",
        "baseProvisioningDays",
        "approvalDays",
        "supportGroup"
      ],
      properties: {
        mode: { type: "string", enum: ["approval-heavy", "balanced", "fast-track"] },
        managerApproval: { type: "boolean" },
        businessApproval: { type: "boolean" },
        architectureApproval: { type: "boolean" },
        securityReview: { type: "boolean" },
        networkProvisioning: { type: "boolean" },
        monitoringForProduction: { type: "boolean" },
        baseProvisioningDays: { type: "integer", minimum: 1 },
        approvalDays: { type: "integer", minimum: 1 },
        supportGroup: { type: "string", minLength: 1 }
      }
    },
    raciConfig: {
      type: "object",
      required: ["roles"],
      properties: {
        roles: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            required: ["key", "label"],
            properties: {
              key: { type: "string", minLength: 1 },
              label: { type: "string", minLength: 1 }
            }
          }
        }
      }
    },
    identity: {
      type: "object",
      required: ["name", "description", "version"],
      properties: {
        name: { type: "string", minLength: 2 },
        nameAr: { type: "string" },
        description: { type: "string", minLength: 10 },
        descriptionAr: { type: "string" },
        version: { type: "string" },
        category: { type: "string" },
        status: { type: "string" },
        owner: { type: "string" },
        date: { type: "string" },
        id: { type: "string" }
      }
    },
    actors: {
      type: "array",
      items: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", minLength: 1 },
          role: { type: "string" },
          department: { type: "string" },
          email: { type: "string" }
        }
      }
    },
    workflow: {
      type: "array",
      items: {
        type: "object",
        required: ["step"],
        properties: {
          step: { type: "string", minLength: 1 },
          actor: { type: "string" },
          type: { type: "string" },
          duration: { type: "string" },
          condition: { type: "string" }
        }
      }
    },
    fields: {
      type: "array",
      items: {
        type: "object",
        required: ["nameEn", "type", "mandatory"],
        properties: {
          nameEn: { type: "string", minLength: 1 },
          nameAr: { type: "string" },
          type: { type: "string", minLength: 1 },
          values: { type: "string" },
          questionAr: { type: "string" },
          mandatory: { type: "string", enum: ["X", "-"] },
          dependency: { type: "string" }
        }
      }
    },
    raci: {
      type: "array",
      items: {
        type: "object",
        required: ["step"],
        properties: {
          step: { type: "string", minLength: 1 },
          requester: { type: "string" },
          businessOwner: { type: "string" },
          requesterManager: { type: "string" },
          deliveryTeams: { type: "string" }
        }
      }
    },
    support: {
      type: "array",
      items: {
        type: "object",
        required: ["supportGroup"],
        properties: {
          supportGroup: { type: "string", minLength: 1 },
          names: { type: "string" },
          emails: { type: "string" }
        }
      }
    },
    sla: {
      type: "object",
      required: ["service", "requester", "supportGroup", "controls", "duration"],
      properties: {
        service: { type: "string", minLength: 1 },
        requester: { type: "string", minLength: 1 },
        prerequisites: { type: "string" },
        supportGroup: { type: "string", minLength: 1 },
        controls: { type: "string", minLength: 1 },
        duration: { type: "string", minLength: 1 },
        notif1Who: { type: "string" },
        notif1When: { type: "string" },
        notif2Who: { type: "string" },
        notif2When: { type: "string" },
        mirrorServiceName: { type: "boolean" }
      }
    },
    slaParts: {
      type: "array",
      items: {
        type: "object",
        required: ["part", "team", "duration"],
        properties: {
          part: { type: "string", minLength: 1 },
          team: { type: "string", minLength: 1 },
          scope: { type: "string" },
          duration: { type: "string", minLength: 1 },
          target: { type: "string" }
        }
      }
    },
    kpis: {
      type: "array",
      items: {
        type: "object",
        required: ["name", "formula", "target", "owner", "frequency"],
        properties: {
          name: { type: "string", minLength: 1 },
          formula: { type: "string", minLength: 1 },
          target: { type: "string", minLength: 1 },
          owner: { type: "string", minLength: 1 },
          frequency: { type: "string", minLength: 1 }
        }
      }
    }
  }
};
