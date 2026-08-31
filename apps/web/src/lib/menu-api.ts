import { apiClient } from './api-client';
import type { MenuCategory, MenuItem } from './api-types';

const DEFAULT_BRANCH_CODE = 'TINOC';

export function getMenuCategories(branchCode = DEFAULT_BRANCH_CODE) {
  return apiClient<MenuCategory[]>(`/branches/${branchCode}/menu/categories`);
}

export function getMenuItems(branchCode = DEFAULT_BRANCH_CODE, categorySlug?: string) {
  const query = categorySlug ? `?category=${encodeURIComponent(categorySlug)}` : '';

  return apiClient<MenuItem[]>(`/branches/${branchCode}/menu/items${query}`);
}
