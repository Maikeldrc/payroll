const configuredBackend = String(import.meta.env.VITE_BACKEND_URL || "https://api.itera.health").replace(/\/$/, "");

export function getBackendUrl(): string {
  if (!configuredBackend) throw new Error("Backend URL is not configured");
  if (window.location.protocol === "https:" && !configuredBackend.startsWith("https://")) {
    throw new Error("HTTPS frontend requires an HTTPS backend");
  }
  if (configuredBackend === window.location.origin) {
    throw new Error("Backend must use a separate origin; same-origin API proxying is prohibited");
  }
  return configuredBackend;
}
