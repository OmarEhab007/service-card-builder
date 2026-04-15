export const enterpriseTemplate = {
  schemaVersion: "1.0.0",
  fulfillment: {
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
  },
  raciConfig: {
    roles: [
      { key: "requester", label: "Requester" },
      { key: "businessOwner", label: "Business Owner" },
      { key: "requesterManager", label: "Requester Manager" },
      { key: "deliveryTeams", label: "System / Network / DB / EA" }
    ]
  },
  identity: {
    name: "Server Request",
    nameAr: "طلب خادم",
    description:
      "This service enables authorized users to submit requests for new server provisioning, including server location, environment, type, and hardware specifications. The process includes manager, business owner, architecture, and technical team approvals before fulfillment.",
    descriptionAr:
      "تتيح هذه الخدمة للمستخدمين المعتمدين تقديم طلبات إنشاء خوادم جديدة، بما في ذلك الموقع والبيئة والنوع والمواصفات الفنية، مع دورة موافقات رسمية قبل التنفيذ.",
    version: "2.0",
    category: "Infrastructure",
    status: "Active",
    owner: "System Team",
    date: "2026-04-15",
    id: "SVC-INF-001"
  },
  actors: [
    { name: "Requester", role: "Service Requestor", department: "Business Units", email: "" },
    { name: "Requester Manager", role: "Approval Owner", department: "Business Units", email: "" },
    { name: "Business Owner", role: "Business Approver", department: "Business", email: "" },
    { name: "System Team", role: "Provisioning Team", department: "IT Infrastructure", email: "SysTeam@cst.gov.sa" },
    { name: "Network Team", role: "Network Provisioning", department: "IT Infrastructure", email: "NetTeam@cst.gov.sa" },
    { name: "Monitoring Team", role: "Monitoring Enablement", department: "IT Operations", email: "ITMonitoring@cst.gov.sa" }
  ],
  workflow: [
    { step: "Fill out the form and submit the request", actor: "Requester", type: "Start", duration: "Same Day", condition: "-" },
    { step: "Manager Approval", actor: "Requester Manager", type: "Decision", duration: "1 Business Day", condition: "-" },
    { step: "Business Owner Approval", actor: "Business Owner", type: "Decision", duration: "1 Business Day", condition: "-" },
    { step: "Enterprise Architecture Approval", actor: "EA Team", type: "Decision", duration: "1 Business Day", condition: "-" },
    { step: "Server Provisioning", actor: "System / Network Team", type: "Action", duration: "2 Business Days", condition: "-" },
    { step: "Monitoring Setup", actor: "Monitoring Team", type: "Action", duration: "1 Business Day", condition: "Production Servers Only" }
  ],
  fields: [
    {
      nameEn: "Business/Project Owner Details (Name, Email, Phone)",
      nameAr: "تفاصيل مالك المشروع",
      type: "Text (AD Browse)",
      values: "Auto-populated from Active Directory / Exchange after selecting the name",
      questionAr: "تفاصيل مالك المشروع",
      mandatory: "X",
      dependency: "-"
    },
    {
      nameEn: "Technical/IT Owner Details (Name, Email, Phone)",
      nameAr: "تفاصيل المالك التقني",
      type: "Text (AD Browse)",
      values: "Auto-populated from Active Directory / Exchange after selecting the name",
      questionAr: "تفاصيل المالك التقني",
      mandatory: "X",
      dependency: "-"
    },
    {
      nameEn: "Location",
      nameAr: "الموقع",
      type: "Menu",
      values: "Riyadh (R0) / Jeddah (J0) / Cloud (C0) Production",
      questionAr: "الموقع",
      mandatory: "X",
      dependency: "-"
    },
    {
      nameEn: "Server Environment",
      nameAr: "بيئة الخادم",
      type: "Menu",
      values: "Development (DV) / Staging (ST) / Production (PD)",
      questionAr: "بيئة الخادم",
      mandatory: "X",
      dependency: "-"
    },
    {
      nameEn: "Type of Server",
      nameAr: "نوع الخادم",
      type: "Menu",
      values: "Web Server (WEB) / Application Server (APP) / Database Server (DB)",
      questionAr: "نوع الخادم",
      mandatory: "X",
      dependency: "-"
    },
    {
      nameEn: "Database Type",
      nameAr: "نوع قاعدة البيانات",
      type: "Menu",
      values: "MSSQL / Oracle / PostgreSQL / MongoDB / MySQL / Other",
      questionAr: "نوع قاعدة البيانات",
      mandatory: "X",
      dependency: "Type of Server = Database Server"
    },
    {
      nameEn: "Server Specifications (Hard Disk, Memory, CPU)",
      nameAr: "مواصفات الخادم",
      type: "Multiple Fields",
      values: "Hard Disk: 80 GB (Default)\nServer Memory: 8 GB (Default)\nServer CPU: 2 CPUs (Default)",
      questionAr: "مواصفات الخادم",
      mandatory: "X",
      dependency: "-"
    },
    {
      nameEn: "Justification",
      nameAr: "المبررات",
      type: "Long Text",
      values: "Provide justification for custom specifications or configurations",
      questionAr: "المبررات",
      mandatory: "X",
      dependency: "-"
    }
  ],
  raci: [
    { step: "Fill out the form and submit the request", requester: "A/R", businessOwner: "I", requesterManager: "-", deliveryTeams: "-" },
    { step: "Manager Approval", requester: "I", businessOwner: "-", requesterManager: "A/R", deliveryTeams: "-" },
    { step: "Business Owner Approval", requester: "I", businessOwner: "A/R", requesterManager: "-", deliveryTeams: "-" },
    { step: "Enterprise Architecture (EA) Approval", requester: "I", businessOwner: "-", requesterManager: "-", deliveryTeams: "A/R" },
    { step: "Network / System Team - Server Provisioning", requester: "I", businessOwner: "-", requesterManager: "-", deliveryTeams: "A/R" },
    { step: "Monitoring Team Setup (Production servers only)", requester: "I", businessOwner: "-", requesterManager: "-", deliveryTeams: "A/R" }
  ],
  support: [
    { supportGroup: "System Team", names: "System Team", emails: "SysTeam@cst.gov.sa" },
    { supportGroup: "Network Team", names: "Network Team", emails: "NetTeam@cst.gov.sa" },
    { supportGroup: "Monitoring Team", names: "Monitoring Team", emails: "ITMonitoring@cst.gov.sa" },
    { supportGroup: "DC Team", names: "DC Team", emails: "DCTeam@cst.gov.sa" }
  ],
  sla: {
    service: "Server Request",
    requester: "IT Users",
    prerequisites: "-",
    supportGroup: "System Team",
    controls: "Multiple Approvals Required",
    duration: "5BD",
    notif1Who: "System Team supervisor",
    notif1When: "75%",
    notif2Who: "System Team manager",
    notif2When: "90%",
    mirrorServiceName: true
  },
  slaParts: [
    {
      part: "Part 1",
      team: "System Team",
      scope: "Initial request validation and provisioning handoff",
      duration: "2BD",
      target: "Validated and assigned within SLA"
    },
    {
      part: "Part 2",
      team: "Network Team",
      scope: "Network configuration and access setup",
      duration: "1BD",
      target: "Connectivity ready"
    },
    {
      part: "Part 3",
      team: "Monitoring Team",
      scope: "Monitoring and alerting onboarding",
      duration: "1BD",
      target: "Production visibility enabled"
    }
  ],
  kpis: [
    {
      name: "% Of request completed within agreed time",
      formula: "# of requests within target time / total # of requests",
      target: "95% of requests within target time",
      owner: "System Team",
      frequency: "Monthly"
    }
  ]
};
