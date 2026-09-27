/**
 * Dual-workspace access layer (Phase 9).
 *
 * ShopFlow splits cleanly into two roles:
 *   Owner   — store owner / admin / manager. Full access to inventory,
 *             analytics, reports, AI dashboards, purchases and settings.
 *   Cashier — counter staff (`staff` in the auth store). Billing-only
 *             surface (Express Billing) with zero admin chrome.
 */
import type { NavItem, NavSection, UserRole } from '@/types';
import { ROUTES } from './routes';

/** Roles that operate the owner / manager workspace. */
export const OWNER_ROLES: readonly UserRole[] = ['owner', 'admin', 'manager'];

/** Roles restricted to the cashier workspace. */
export const CASHIER_ROLES: readonly UserRole[] = ['staff'];

/** Backwards-compatible alias for existing router usages. */
export const MANAGER_ROLES = OWNER_ROLES;

/** Route group access controls. */
export const OWNER_ACCESS: readonly UserRole[] = OWNER_ROLES;
export const CASHIER_ACCESS: readonly UserRole[] = ['owner', 'admin', 'manager', 'staff'];

export const OWNER_HOME = ROUTES.DASHBOARD;
export const CASHIER_HOME = ROUTES.EMPLOYEE_BILLING;

export function isOwnerRole(role?: UserRole | null): boolean {
  if (!role) return false;
  return OWNER_ROLES.includes(role);
}

export function isCashierRole(role?: UserRole | null): boolean {
  return !isOwnerRole(role);
}

export function isEmployeeRole(role?: UserRole | null): boolean {
  return !isOwnerRole(role);
}

/** Determines where a user should land after sign-in or when bounced. */
export function homePathForRole(role?: UserRole | null): string {
  return isOwnerRole(role) ? OWNER_HOME : CASHIER_HOME;
}

/** Nav item visibility based on role. Items without `roles` are open to everyone. */
export function isNavItemVisible(item: NavItem, role?: UserRole | null): boolean {
  if (!item.roles || item.roles.length === 0) return true;
  if (!role) return false;
  return item.roles.includes(role);
}

/** Filters navigation sections so cashiers never see owner-only entries. */
export function filterNavSections(
  sections: NavSection[],
  role?: UserRole | null,
): NavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => isNavItemVisible(item, role)),
    }))
    .filter((section) => section.items.length > 0);
}
