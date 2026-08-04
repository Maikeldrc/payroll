import fs from "node:fs";
import path from "node:path";

function filesUnder(root) {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? filesUnder(path.join(root, entry.name)) : [path.join(root, entry.name)]);
}
const frontendFiles = filesUnder("src").filter((file) => /\.(ts|tsx)$/.test(file));
const banned = ["sheets.googleapis.com", "requestGoogleSheetsToken", "localStorage.setItem", "sessionStorage.setItem", "indexedDB.open", "navigator.serviceWorker.register"];
const findings = [];
for (const file of frontendFiles) {
  const content = fs.readFileSync(file, "utf8");
  for (const token of banned) if (content.includes(token)) findings.push(`${file}:${token}`);
}
if (findings.length) throw new Error(`Frontend security source gate failed: ${findings.join(", ")}`);
console.log(`Frontend source security gate verified across ${frontendFiles.length} files.`);
