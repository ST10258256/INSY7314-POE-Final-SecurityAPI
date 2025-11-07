// Frontend/src/utils/auth.js

const TOKEN_KEY = "bank_token";
const USER_KEY = "bank_user";

export function saveAuth({ token, user }) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  const v = localStorage.getItem(USER_KEY);
  try {
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}


export function getRoleFromToken(token) {
  if (!token || typeof token !== "string") return null;
  try {
    // Accept "Bearer <token>" also
    const raw = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
    const parts = raw.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = payload.length % 4;
    const padded = pad ? payload + "=".repeat(4 - pad) : payload;
    // atob is present in browsers; fallback safe try/catch
    const json = typeof atob === "function" ? atob(padded) : Buffer.from(padded, "base64").toString("utf8");
    const obj = JSON.parse(json);
    if (obj.role) return String(obj.role);
    if (obj.roles) return String(obj.roles);
    if (obj["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"])
      return String(obj["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]);
    return null;
  } catch {
    return null;
  }
}

/** Unified getRole: prefer stored user object, fallback to token decode */
export function getRole() {
  const user = getUser();
  if (user) {
    if (user.role) return String(user.role);
    if (user.roles) return String(user.roles);
  }
  const token = getToken();
  return getRoleFromToken(token);
}

export function isAdminRole() {
  const r = getRole();
  return Boolean(r && String(r).toLowerCase() === "admin");
}

export function isEmployeeRole() {
  const r = getRole();
  return Boolean(r && String(r).toLowerCase() === "employee");
}

export function isUserRole() {
  const r = getRole();
  return Boolean(r && String(r).toLowerCase() === "user");
}
