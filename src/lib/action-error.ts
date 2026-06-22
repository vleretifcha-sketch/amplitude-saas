/** Message Next.js quand la Server Action échoue (souvent payload trop lourd). */
export function isUnexpectedServerActionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.message.includes('An unexpected response was received from the server');
}
