export async function guardSubmission(
  _req: Request,
  _body: unknown,
  _opts: { name: string; limit: number; window: string; captcha?: boolean; emails?: unknown[]; minMs?: number }
): Promise<Response | null> {
  return null;
}