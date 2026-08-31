import { apiClient } from './api-client';
import type {
  AdminReservation,
  AssignAdminReservationTablesPayload,
  ReservationStatus,
  ReviewAdminReservationPayload,
  UpdateAdminReservationStatusPayload,
} from './api-types';

export function getAdminReservations(
  token: string,
  status?: ReservationStatus,
) {
  const query = status ? `?status=${status}` : '';

  return apiClient<AdminReservation[]>(`/admin/reservations${query}`, {
    token,
  });
}

export function getAdminReservationById(token: string, reservationId: string) {
  return apiClient<AdminReservation>(`/admin/reservations/${reservationId}`, {
    token,
  });
}

export function reviewAdminReservation(
  token: string,
  reservationId: string,
  payload: ReviewAdminReservationPayload,
) {
  return apiClient<AdminReservation>(
    `/admin/reservations/${reservationId}/review`,
    {
      method: 'PATCH',
      token,
      body: payload,
    },
  );
}

export function assignAdminReservationTables(
  token: string,
  reservationId: string,
  payload: AssignAdminReservationTablesPayload,
) {
  return apiClient<AdminReservation>(
    `/admin/reservations/${reservationId}/tables`,
    {
      method: 'PATCH',
      token,
      body: payload,
    },
  );
}

export function updateAdminReservationStatus(
  token: string,
  reservationId: string,
  payload: UpdateAdminReservationStatusPayload,
) {
  return apiClient<AdminReservation>(
    `/admin/reservations/${reservationId}/status`,
    {
      method: 'PATCH',
      token,
      body: payload,
    },
  );
}
