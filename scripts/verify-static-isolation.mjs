import fs from "node:fs";
import path from "node:path";

const dist = path.resolve("dist");
if (!fs.existsSync(path.join(dist, "index.html"))) throw new Error("Static build is missing index.html");
const files = fs.readdirSync(dist, { recursive: true }).map(String).filter((file) => fs.statSync(path.join(dist, file)).isFile());
const forbiddenFiles = files.filter((file) => /server\.(cjs|js|map)$|\.env|private|credential/i.test(file));
if (forbiddenFiles.length) throw new Error(`Forbidden static artifacts: ${forbiddenFiles.join(", ")}`);
const forbiddenContent = ["sheets.googleapis.com", "/api/sheets", "/api/ai-assistant", "GEMINI_API_KEY", "BEGIN PRIVATE KEY", "requestGoogleSheetsToken"];
const findings = [];
let combined = "";
for (const file of files) {
  const contents = fs.readFileSync(path.join(dist, file), "utf8");
  combined += contents;
  for (const token of forbiddenContent) if (contents.includes(token)) findings.push(`${file}:${token}`);
}
if (findings.length) throw new Error(`Static isolation failed: ${findings.join(", ")}`);
if (!combined.includes("https://api.itera.health")) throw new Error("Static bundle does not contain the approved direct backend origin");
console.log(`Static isolation verified across ${files.length} artifacts.`);
