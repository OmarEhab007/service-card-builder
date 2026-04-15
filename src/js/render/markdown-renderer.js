export function renderMarkdown(state) {
  const actors = state.actors || [];
  const workflow = state.workflow || [];
  const fields = state.fields || [];
  const raci = state.raci || [];
  const support = state.support || [];
  const sla = state.sla || {};
  const slaParts = state.slaParts || [];
  const kpis = state.kpis || [];
  const toRows = (rows, keys) => rows.map((row) => `| ${keys.map((key) => String(row[key] || "").replace(/\|/g, "\\|")).join(" | ")} |`).join("\n");

  let md = `# ${state.identity.name || "Service Card"}\n\n`;
  md += `- Version: ${state.identity.version || "1.0"}\n`;
  md += `- Category: ${state.identity.category || ""}\n`;
  md += `- Status: ${state.identity.status || ""}\n`;
  md += `- Owner: ${state.identity.owner || ""}\n`;
  md += `- Date: ${state.identity.date || ""}\n\n`;

  md += `## Service Description\n\n${state.identity.description || ""}\n\n`;
  if (state.identity.descriptionAr) md += `> AR: ${state.identity.descriptionAr}\n\n`;

  md += `## Actors\n\n| Name | Role | Department | Email |\n|---|---|---|---|\n`;
  md += actors.length ? `${toRows(actors, ["name", "role", "department", "email"])}\n\n` : "| - | - | - | - |\n\n";

  md += `## Workflow\n\n| Step | Actor | Type | Duration | Condition |\n|---|---|---|---|---|\n`;
  md += workflow.length ? `${toRows(workflow, ["step", "actor", "type", "duration", "condition"])}\n\n` : "| - | - | - | - | - |\n\n";

  md += `## Form Template\n\n| Field Name (Arabic and English) | Field Type | Field Initial Values | السؤال بالعربية | Mandatory | Dependency |\n|---|---|---|---|---|---|\n`;
  md += fields.length
    ? `${fields
        .map((f) => `| ${String(f.nameEn || "").replace(/\|/g, "\\|")} / ${String(f.nameAr || "").replace(/\|/g, "\\|")} | ${String(f.type || "").replace(/\|/g, "\\|")} | ${String(f.values || "").replace(/\|/g, "\\|")} | ${String(f.questionAr || "").replace(/\|/g, "\\|")} | ${String(f.mandatory || "").replace(/\|/g, "\\|")} | ${String(f.dependency || "").replace(/\|/g, "\\|")} |`)
        .join("\n")}\n\n`
    : "| - | - | - | - | - | - |\n\n";

  md += `## RACI\n\n| STEP | Requester | Business Owner | Requester Manager | System Team / Network / DB Team / EA Team |\n|---|---|---|---|---|\n`;
  md += raci.length
    ? `${toRows(raci, ["step", "requester", "businessOwner", "requesterManager", "deliveryTeams"])}\n\n`
    : "| - | - | - | - | - |\n\n";

  md += `## Support Group\n\n| Support Group | Names | Emails |\n|---|---|---|\n`;
  md += support.length ? `${toRows(support, ["supportGroup", "names", "emails"])}\n\n` : "| - | - | - |\n\n";

  md += "## SLA and Escalation Table\n\n";
  md += `| Service | Requester(s) | Pre-Requisites | Support Group | Controls | Duration | Approval Notification (Who) | Approval Notification (When) |\n`;
  md += `|---|---|---|---|---|---|---|---|\n`;
  md += `| ${sla.service || ""} | ${sla.requester || ""} | ${sla.prerequisites || ""} | ${sla.supportGroup || ""} | ${sla.controls || ""} | ${sla.duration || ""} | ${sla.notif1Who || ""}; ${sla.notif2Who || ""} | ${sla.notif1When || ""}; ${sla.notif2When || ""} |\n\n`;

  md += "### SLA Parts (Multi-team)\n\n";
  md += `| Part / Phase | Responsible Team | Scope | SLA Duration | Target |\n`;
  md += `|---|---|---|---|---|\n`;
  md += slaParts.length ? `${toRows(slaParts, ["part", "team", "scope", "duration", "target"])}\n\n` : "| - | - | - | - | - |\n\n";

  md += `### KPIs\n\n| KPIs | Formula | Target | Responsibility | Frequency Measurement |\n|---|---|---|---|---|\n`;
  md += kpis.length ? `${toRows(kpis, ["name", "formula", "target", "owner", "frequency"])}\n` : "| - | - | - | - | - |\n";
  return md;
}
