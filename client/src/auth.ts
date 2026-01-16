export const APP_PASSWORD = "drx@2026";
export const AUTH_KEY = "sctibaalfi";

export function isAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === "true";
}

export function authenticate(password: string) {
  if (password === APP_PASSWORD) {
    localStorage.setItem(AUTH_KEY, "true");
    return true;
  }
  return false;
}
