import "dotenv/config";
import { createServer } from "node:http";
import { createBackendApp } from "./backend/app";

const port = Number(process.env.PORT || 8080);
const app = createBackendApp();
const server = createServer(app);

server.listen(port, "0.0.0.0", () => {
  // Startup metadata only. Never log request payloads or patient data.
  console.info(JSON.stringify({ event: "backend.started", port, environment: process.env.NODE_ENV || "development" }));
});

function shutdown(signal: string) {
  console.info(JSON.stringify({ event: "backend.stopping", signal }));
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
