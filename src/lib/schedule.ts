// Set this to the real launch time (IST = +05:30)
export const OPEN_AT = new Date('2026-10-06T13:45:00+05:30').getTime();

// Set to a timestamp to also close registration. null = stays open.
export const CLOSE_AT: number | null = null;

export function registrationState(now = Date.now()): 'before' | 'open' | 'closed' {
  if (now < OPEN_AT) return 'before';
  if (CLOSE_AT !== null && now > CLOSE_AT) return 'closed';
  return 'open';
}

// Client-side check only. The server compares against the private PREVIEW_KEY.
export function isPreview(key: string | null | undefined) {
  const expected = process.env.NEXT_PUBLIC_PREVIEW_KEY;
  return !!expected && key === expected;
}