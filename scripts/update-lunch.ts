import { lunchSchema, type LunchData } from "../src/types";
import { readData, saveData } from "./io";
import { fetchLunch } from "./providers/lunch";
async function main() {
  let next: LunchData;
  let failed = false;
  try {
    next = await fetchLunch();
  } catch (error) {
    console.error(
      `Päevapakkumine: ${error instanceof Error ? error.message : "allika päring ebaõnnestus"}`,
    );
    next = {
      checkedAt: new Date().toISOString(),
      offerDate: null,
      status: "error",
      items: [],
    };
    failed = true;
  }
  const previous = await readData("lunch", lunchSchema);
  // Repeated identical menus need no commit/deployment; retain the last content check timestamp.
  const content = ({ checkedAt: _, ...data }: LunchData) =>
    JSON.stringify(data);
  if (content(previous) !== content(next))
    await saveData("lunch", next, lunchSchema);
  console.log(
    `Lido: ${next.status}, ${next.offerDate ?? "kuupäev kinnitamata"}, ${next.items.length} pakkumist.`,
  );
  if (failed) process.exitCode = 1;
}
main().catch((error) => {
  console.error(
    `Päevapakkumise faili ei õnnestunud uuendada: ${error.message}`,
  );
  process.exitCode = 1;
});
