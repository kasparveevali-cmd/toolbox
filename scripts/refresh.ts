import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
const jobs = [
  { name: "news", script: "scripts/update-news.ts", hours: 1 },
  { name: "markets", script: "scripts/update-markets.ts", hours: 6 },
  { name: "bus25", script: "scripts/update-gtfs.ts", hours: 24 },
];
let failures = 0;
for (const job of jobs) {
  const current = JSON.parse(
    await readFile(`public/data/${job.name}.json`, "utf8"),
  ) as { updatedAt: string | null };
  if (
    process.argv.includes("--due") &&
    current.updatedAt &&
    Date.now() - Date.parse(current.updatedAt) < job.hours * 3600000
  )
    continue;
  const result = spawnSync(
    process.execPath,
    ["--use-env-proxy", "--use-system-ca", "--import", "tsx", job.script],
    { stdio: "inherit", env: process.env },
  );
  if (result.status !== 0) failures++;
}
if (failures) {
  console.error(
    `${failures} andmeuuendust ebaõnnestus. Viimased kehtivad failid säilitati.`,
  );
  process.exitCode = 1;
}
