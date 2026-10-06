// Opens 1:45 PM IST, 6 Oct 2026
export const OPEN_AT = new Date('2026-10-06T13:45:00+05:30').getTime();

// Set to a timestamp (e.g. new Date('2026-10-06T23:59:59+05:30').getTime())
// if you also want it to close. null = stays open.
export const CLOSE_AT: number | null = null;

export function registrationState(now = Date.now()): 'before' | 'open' | 'closed' {
  if (now < OPEN_AT) return 'before';
  if (CLOSE_AT !== null && now > CLOSE_AT) return 'closed';
  return 'open';
}