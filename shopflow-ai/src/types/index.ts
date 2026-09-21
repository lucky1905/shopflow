import type { ComponentType, ReactNode } from 'react';

/* -------------------------------------------------------------------------- */
/*  User & authentication                                                     */
/* -------------------------------------------------------------------------- */

export type UserRole = 'owner' | 'admin' | 'manager' | 'staff';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  storeId?: string;
  storeName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  /** `true` while the persisted session is being re-hydrated / validated. */
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  storeName: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  password: string;
  confirmPassword: string;
}

/* -------------------------------------------------------------------------- */
/*  Theme                                                                     */
/* -------------------------------------------------------------------------- */

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeState {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
}

/* -------------------------------------------------------------------------- */
/*  Layout state                                                              */
/* -------------------------------------------------------------------------- */

export interface SidebarState {
  isOpen: boolean;
  isCollapsed: boolean;
  mobileOpen: boolean;
}

export interface UIState {
  commandMenuOpen: boolean;
  searchQuery: string;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
}

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIconLike;
  /** Renders a visual separator above the item. */
  dividerBefore?: boolean;
  badge?: string;
  /** Hides the item from the collapsed rail / non-admins. */
  roles?: UserRole[];
  external?: boolean;
}

export interface NavSection {
  id: string;
  title?: string;
  items: NavItem[];
}

/** Structural type for Lucide icons so we do not depend on its internal types. */
export type LucideIconLike = ComponentType<{ className?: string }>;

/* -------------------------------------------------------------------------- */
/*  Notifications                                                             */
/* -------------------------------------------------------------------------- */

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

export interface NotificationState {
  notifications: Notification[];
  totalUnread: number;
  isOpen: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Store (tenant)                                                            */
/* -------------------------------------------------------------------------- */

export interface Store {
  id: string;
  name: string;
  address?: string;
  currency: string;
  timezone: string;
  logo?: string;
}

/* -------------------------------------------------------------------------- */
/*  Async helpers                                                             */
/* -------------------------------------------------------------------------- */

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface FormErrors {
  [key: string]: string | string[];
}

/* -------------------------------------------------------------------------- */
/*  API contracts                                                             */
/* -------------------------------------------------------------------------- */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, string[]>;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  field: string;
  value: string | number | boolean | null;
  operator?: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
}

export interface QueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  [key: string]: string | number | boolean | undefined;
}

/* -------------------------------------------------------------------------- */
/*  Reusable UI contracts                                                     */
/* -------------------------------------------------------------------------- */

export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'gradient'
  | 'outline';

export type ButtonVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive';

export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export type ComponentSize = 'sm' | 'md' | 'lg';
