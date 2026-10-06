import { spawnSync } from "node:child_process";
import { busConfig } from "../src/config/dashboard";
// Python's standard-library ZIP/CSV streams avoid loading the national feed into memory.
const result = spawnSync(
  "python3",
  ["scripts/gtfs.py", JSON.stringify(busConfig)],
  { stdio: "inherit", env: process.env },
);
if (result.error) console.error("GTFS töötlemiseks on vaja Python 3.");
process.exitCode = result.status ?? 1;
