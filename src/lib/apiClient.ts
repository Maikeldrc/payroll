import { auth } from "./firebase";
import { getBackendUrl } from "../config/runtime";

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const backendUrl = getBackendUrl();
  const user = auth.currentUser;
  if (!user) throw new Error("Authentication required");
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${await user.getIdToken()}`);
  headers.set("X-Correlation-Id", crypto.randomUUID());
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(`${backendUrl}${path}`, { ...init, headers, credentials: "omit", cache: "no-store" });
  if (response.status === 401) {
    await auth.signOut();
    throw new Error("Session expired");
  }
  return response;
}
