// Shared by the auth pages to safely resume a same-site destination after sign-in.

// Resolve ?returnTo= to a safe same-origin path, else "/".
//
// Reject same-origin-looking paths that normalize into a protocol-relative URL.
export function safeReturnTo() {
  const raw = new URLSearchParams(window.location.search).get("returnTo");
  if (!raw) return "/";
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return "/";
    // Never carry authentication credentials from query parameters into the app.
    for (const p of ["access_token", "refresh_token", "token_hash"]) url.searchParams.delete(p);
    const path = url.pathname + url.search;
    if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return "/";
    return path;
  } catch {
    return "/";
  }
}
