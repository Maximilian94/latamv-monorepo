/**
 * Turn a raw error from the Rust HTTP bridge into a message a pilot can act on.
 *
 * The bridge (src-tauri/src/api.rs) rejects with either:
 *   - `HTTP <status>: <body>` for non-2xx responses (body is usually JSON), or
 *   - a reqwest transport error string (connection refused, DNS, timeout, TLS).
 *
 * Every returned message says what happened AND how to move forward — never a
 * bare "Error" or a raw stack.
 */
export function humanizeError(raw: unknown): string {
  const text = String(raw ?? '').replace(/^Error:\s*/, '').trim();
  if (!text) return 'Something went wrong. Please try again.';

  const httpMatch = text.match(/^HTTP\s+(\d{3}):\s*([\s\S]*)$/i);
  if (httpMatch) {
    const status = Number(httpMatch[1]);
    const body = httpMatch[2].trim();

    const fromBody = messageFromBody(body);
    if (fromBody) return fromBody;

    switch (status) {
      case 400:
        return 'The server rejected the request. Check your details and try again.';
      case 401:
        return 'Your login is invalid or expired. Please sign in again.';
      case 403:
        return "You don't have permission to do that. Contact an administrator if you think this is wrong.";
      case 404:
        return "We couldn't find what you were looking for. It may have been removed.";
      case 409:
        return 'That conflicts with something already in progress. Refresh and try again.';
      case 500:
      case 502:
      case 503:
        return 'The server had a problem. Wait a moment and try again.';
      default:
        return `The server returned an error (${status}). Please try again.`;
    }
  }

  // Transport-level failures (no HTTP response reached us).
  const low = text.toLowerCase();
  if (
    low.includes('connection refused') ||
    low.includes('error sending request') ||
    low.includes('dns') ||
    low.includes('tcp connect') ||
    low.includes('failed to lookup') ||
    low.includes('timed out') ||
    low.includes('timeout')
  ) {
    return "Couldn't reach the server. Check your internet connection and the server URL in Server settings.";
  }
  if (low.includes('certificate') || low.includes('tls') || low.includes('ssl')) {
    return "Couldn't establish a secure connection to the server. Check the server URL in Server settings.";
  }

  return text;
}

/** Extract a human message from a JSON error body, if present. */
function messageFromBody(body: string): string | null {
  if (!body || (body[0] !== '{' && body[0] !== '[')) return null;
  try {
    const data = JSON.parse(body);
    const msg = data?.message ?? data?.error;
    if (Array.isArray(msg)) return msg.filter(Boolean).join(' ');
    if (typeof msg === 'string' && msg.trim()) return msg.trim();
  } catch {
    /* not JSON — fall through */
  }
  return null;
}
