import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { isLunchMorning } from "../src/utils/lunch";
const jobs = [
  { name: "news", script: "scripts/update-news.ts", hours: 1 },
  { name: "markets", script: "scripts/update-markets.ts", hours: 6 },
  { name: "bus25", script: "scripts/update-gtfs.ts", hours: 24 },
  { name: "lunch", script: "scripts/update-lunch.ts", hours: 0.5 },
];
let failures = 0;
for (const job of jobs) {
  if (process.argv.includes("--lunch-only") && job.name !== "lunch") continue;
  if (job.name === "lunch" && process.argv.includes("--due")) {
    // Lunch is checked only by the half-hour morning trigger, not also at :17.
    if (!process.argv.includes("--lunch-only") || !isLunchMorning(new Date()))
      continue;
  }
  const current = JSON.parse(
    await readFile(`public/data/${job.name}.json`, "utf8"),
  ) as { updatedAt?: string | null; checkedAt?: string | null };
  const checkedAt = current.updatedAt ?? current.checkedAt;
  if (
    job.name !== "lunch" &&
    process.argv.includes("--due") &&
    checkedAt &&
    Date.now() - Date.parse(checkedAt) < job.hours * 3600000
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
    `${failures} andmeuuendust ebaõnnestus. Vahemälu või allika veaseisund salvestati.`,
  );
  process.exitCode = 1;
}
