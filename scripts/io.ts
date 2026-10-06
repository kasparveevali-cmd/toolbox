import { readFile, writeFile, rename } from "node:fs/promises";
import type { z } from "zod";
export async function readData<T>(
  name: string,
  schema: z.ZodType<T>,
): Promise<T> {
  return schema.parse(
    JSON.parse(await readFile(`public/data/${name}.json`, "utf8")),
  );
}
export async function saveData<T>(
  name: string,
  value: T,
  schema: z.ZodType<T>,
) {
  const contents = JSON.stringify(schema.parse(value), null, 2) + "\n";
  const target = `public/data/${name}.json`;
  await writeFile(`${target}.tmp`, contents);
  await rename(`${target}.tmp`, target);
}
export async function fetchPublic(url: string, timeout = 30000) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(timeout),
    headers: {
      "User-Agent": "MinuDashboard/1.0 (public RSS and daily data)",
      Accept: "application/json, application/xml, text/xml, */*",
    },
  });
  if (!response.ok) throw new Error(`Allikas vastas HTTP ${response.status}`);
  return response;
}
