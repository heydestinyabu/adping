import { PERMISSIONS, PermissionMap } from "@shared/schema";
import { Role } from "@shared/roles";

export function resolveUserPermissions(
  role: string,
  dbPermissions?: string[]
): PermissionMap {
  if (role === Role.ADMIN || role === Role.SUPERADMIN) {
    // Admin gets all permissions dynamically from PERMISSIONS
    const all: PermissionMap = {};
    Object.values(PERMISSIONS).forEach((perm) => {
      all[perm] = true;
    });
    return all;
  }

  // For other roles → convert DB array to PermissionMap
  if (!dbPermissions || dbPermissions.length === 0) {
    return {};
  }

  return dbPermissions.reduce((acc, perm) => {
    acc[perm] = true;
    return acc;
  }, {} as PermissionMap);
}
