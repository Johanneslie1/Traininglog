const AUTH_PATHS = new Set(['/login', '/register', '/forgot-password']);

/** Keeps post-login navigation inside the app. */
export function getSafeReturnPath(from: unknown, fallback = '/'): string {
  if (typeof from !== 'string' || from.length === 0) {
    return fallback;
  }

  if (!from.startsWith('/') || from.startsWith('//') || from.includes('\\') || from.includes('://')) {
    return fallback;
  }

  const pathOnly = from.split(/[?#]/)[0] ?? from;
  if (AUTH_PATHS.has(pathOnly)) {
    return fallback;
  }

  return from;
}
