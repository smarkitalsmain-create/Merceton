import { PERMISSIONS } from "@/lib/auth/adminRbac"

/**
 * Seed default permissions into the database
 * NOTE: Permission/Role models removed - RBAC disabled
 * This function is kept for compatibility but does nothing
 */
export async function seedPermissions() {
  console.log("RBAC disabled - permissions seeding skipped")
}

/**
 * Create default "Super Admin" role with all permissions
 * NOTE: Role model removed - RBAC disabled
 */
export async function seedDefaultRoles() {
  console.log("RBAC disabled - role seeding skipped")
}
