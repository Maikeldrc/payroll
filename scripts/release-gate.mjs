import { spawnSync } from "node:child_process";

const steps = [
  ["npm", ["run", "lint"]],
  ["npm", ["run", "verify:source"]],
  ["npm", ["run", "test:security"]],
  ["npm", ["run", "build"]],
  ["npm", ["run", "verify:static"]],
  ["npm", ["run", "build:backend"]],
  ["npm", ["audit", "--audit-level=high"]],
];
for (const [command, args] of steps) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log("Security release gate passed. Operational and contractual evidence must still be approved separately.");
