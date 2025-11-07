import { jwtDecode } from "jwt-decode";

export function getUserRole() {
  const token = localStorage.getItem("bank_token");
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);

    return decoded.role
      || decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
      || null;
  } catch {
    return null;
  }
}
