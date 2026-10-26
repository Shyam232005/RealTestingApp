"use client";

/**
 * Completely logs out the user:
 * 1. Calls the server-side /api/auth/logout endpoint to invalidate HTTP-only session cookies and trigger Clear-Site-Data.
 * 2. Purges all localStorage entries.
 * 3. Purges all sessionStorage entries.
 * 4. Invalidates all document cookies across root and subdomain paths.
 * 5. Deletes all client-side IndexedDB databases if accessible.
 * 6. Hard-redirects to /login replacing history to prevent back-button navigation.
 */
export async function performClientLogout() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Cache-Control": "no-cache" },
      cache: "no-store",
    });
  } catch (err) {
    console.error("Logout request error:", err);
  }

  // 1. Clear LocalStorage
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.clear();
    }
  } catch (err) {
    console.error("Failed to clear localStorage:", err);
  }

  // 2. Clear SessionStorage
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.clear();
    }
  } catch (err) {
    console.error("Failed to clear sessionStorage:", err);
  }

  // 3. Clear Document Cookies
  try {
    if (typeof document !== "undefined") {
      const cookies = document.cookie.split(";");
      const hostname = window.location.hostname;
      cookies.forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substring(0, eqPos).trim() : c.trim();
        if (name) {
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;`;
          document.cookie = `${name}=; path=/; domain=${hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;`;
          if (hostname.includes(".")) {
            document.cookie = `${name}=; path=/; domain=.${hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;`;
          }
        }
      });
    }
  } catch (err) {
    console.error("Failed to clear document cookies:", err);
  }

  // 4. Clear IndexedDB if available
  try {
    if (typeof window !== "undefined" && window.indexedDB && window.indexedDB.databases) {
      const dbs = await window.indexedDB.databases();
      for (const db of dbs) {
        if (db.name) {
          window.indexedDB.deleteDatabase(db.name);
        }
      }
    }
  } catch (err) {
    // Non-blocking in sandboxed environments
  }

  // 5. Hard redirect replacing history so back button cannot restore previous authenticated views
  if (typeof window !== "undefined") {
    window.location.replace("/login");
  }
}
