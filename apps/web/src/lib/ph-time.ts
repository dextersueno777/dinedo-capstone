export const PH_TIME_ZONE = 'Asia/Manila';

export function formatDateTimePH(value: string | Date) {
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: PH_TIME_ZONE,
  }).format(new Date(value));
}

export function formatDatePH(value: string | Date) {
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeZone: PH_TIME_ZONE,
  }).format(new Date(value));
}

export function formatTimePH(value: string | Date) {
  return new Intl.DateTimeFormat('en-PH', {
    timeStyle: 'short',
    timeZone: PH_TIME_ZONE,
  }).format(new Date(value));
}

export function getManilaDatetimeLocalValue(daysFromNow = 0, hour = 12, minute = 0) {
  const now = new Date();
  const manilaParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PH_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const year = manilaParts.find((part) => part.type === 'year')?.value ?? '2026';
  const month = manilaParts.find((part) => part.type === 'month')?.value ?? '01';
  const day = manilaParts.find((part) => part.type === 'day')?.value ?? '01';

  const manilaDate = new Date(`${year}-${month}-${day}T00:00:00+08:00`);
  manilaDate.setDate(manilaDate.getDate() + daysFromNow);

  const nextParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PH_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(manilaDate);

  const nextYear = nextParts.find((part) => part.type === 'year')?.value ?? year;
  const nextMonth = nextParts.find((part) => part.type === 'month')?.value ?? month;
  const nextDay = nextParts.find((part) => part.type === 'day')?.value ?? day;

  return `${nextYear}-${nextMonth}-${nextDay}T${String(hour).padStart(2, '0')}:${String(
    minute,
  ).padStart(2, '0')}`;
}

export function manilaDatetimeLocalToIso(value: string) {
  return new Date(`${value}:00+08:00`).toISOString();
}
