import { apiClient } from './api-client';
import type {
  CancelReservationPayload,
  CreateReservationPayload,
  Reservation,
} from './api-types';

export function createReservation(
  token: string,
  payload: CreateReservationPayload,
) {
  return apiClient<Reservation>('/reservations', {
    method: 'POST',
    token,
    body: payload,
  });
}

export function getMyReservations(token: string) {
  return apiClient<Reservation[]>('/reservations', {
    token,
  });
}

export function getReservationById(token: string, reservationId: string) {
  return apiClient<Reservation>(`/reservations/${reservationId}`, {
    token,
  });
}

export function cancelReservation(
  token: string,
  reservationId: string,
  payload: CancelReservationPayload,
) {
  return apiClient<Reservation>(`/reservations/${reservationId}/cancel`, {
    method: 'PATCH',
    token,
    body: payload,
  });
}
