import { apiClient } from './api-client';
import type {
  AdminInventoryItem,
  AdminStockMovement,
  CreateAdminInventoryItemPayload,
  CreateAdminStockMovementPayload,
  InventoryItemStatus,
  UpdateAdminInventoryItemPayload,
} from './api-types';

export async function getAdminInventoryItems(
  token: string,
  status?: InventoryItemStatus | 'ALL',
  branchCode = 'TINOC',
) {
  const params = new URLSearchParams();

  if (branchCode) {
    params.set('branchCode', branchCode);
  }

  if (status && status !== 'ALL') {
    params.set('status', status);
  }

  return apiClient<AdminInventoryItem[]>(
    `/admin/inventory?${params.toString()}`,
    {
      token,
    },
  );
}

export async function createAdminInventoryItem(
  token: string,
  payload: CreateAdminInventoryItemPayload,
) {
  return apiClient<AdminInventoryItem>('/admin/inventory', {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function updateAdminInventoryItem(
  token: string,
  inventoryItemId: string,
  payload: UpdateAdminInventoryItemPayload,
) {
  return apiClient<AdminInventoryItem>(
    `/admin/inventory/${inventoryItemId}`,
    {
      method: 'PATCH',
      token,
      body: payload,
    },
  );
}

export async function getAdminStockMovements(
  token: string,
  inventoryItemId: string,
) {
  return apiClient<AdminStockMovement[]>(
    `/admin/inventory/${inventoryItemId}/movements`,
    {
      token,
    },
  );
}

export async function createAdminStockMovement(
  token: string,
  inventoryItemId: string,
  payload: CreateAdminStockMovementPayload,
) {
  return apiClient<AdminStockMovement>(
    `/admin/inventory/${inventoryItemId}/movements`,
    {
      method: 'POST',
      token,
      body: payload,
    },
  );
}
