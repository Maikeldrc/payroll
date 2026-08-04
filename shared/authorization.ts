export const ROLE_NAMES = [
  "System Administrator",
  "Operations Administrator",
  "Payroll Administrator",
  "Billing Administrator",
  "Clinical Administrator",
  "Operations Manager",
  "Supervisor",
  "Care Manager",
  "Provider Viewer",
  "Executive Viewer",
  "Auditor",
] as const;

export type RoleName = (typeof ROLE_NAMES)[number];

export const PERMISSIONS = [
  "dashboard:view",
  "patient:view",
  "patient:update",
  "performance:view",
  "payroll:view",
  "payroll:manage",
  "billing:view",
  "quality:view",
  "import:create",
  "report:create",
  "report:download",
  "configuration:view",
  "configuration:manage",
  "audit:view",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL: ReadonlySet<Permission> = new Set(PERMISSIONS);

export const ROLE_PERMISSIONS: Readonly<Record<RoleName, ReadonlySet<Permission>>> = {
  "System Administrator": ALL,
  "Operations Administrator": new Set(["dashboard:view", "patient:view", "patient:update", "performance:view", "quality:view", "import:create", "report:create", "report:download", "configuration:view", "configuration:manage"]),
  "Payroll Administrator": new Set(["dashboard:view", "performance:view", "payroll:view", "payroll:manage", "report:create", "report:download"]),
  "Billing Administrator": new Set(["dashboard:view", "patient:view", "billing:view", "report:create", "report:download"]),
  "Clinical Administrator": new Set(["dashboard:view", "patient:view", "patient:update", "performance:view", "quality:view", "report:create", "report:download"]),
  "Operations Manager": new Set(["dashboard:view", "patient:view", "performance:view", "quality:view", "report:create", "report:download"]),
  Supervisor: new Set(["dashboard:view", "patient:view", "patient:update", "performance:view", "quality:view", "report:create"]),
  "Care Manager": new Set(["patient:view", "patient:update", "performance:view", "quality:view"]),
  "Provider Viewer": new Set(["dashboard:view", "patient:view", "performance:view"]),
  "Executive Viewer": new Set(["dashboard:view", "performance:view"]),
  Auditor: new Set(["dashboard:view", "performance:view", "payroll:view", "billing:view", "report:download", "configuration:view", "audit:view"]),
};

export function isRoleName(value: unknown): value is RoleName {
  return typeof value === "string" && (ROLE_NAMES as readonly string[]).includes(value);
}

export function roleHasPermission(role: RoleName, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].has(permission);
}
