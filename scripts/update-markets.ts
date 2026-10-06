import { indices } from "../src/config/indices";
import { marketsSchema } from "../src/types";
import { readData, saveData } from "./io";
import { fetchIndex } from "./providers/markets";
async function main() {
  const previous = await readData("markets", marketsSchema);
  const results = await Promise.allSettled(indices.map(fetchIndex));
  const fresh = results.flatMap((r, i) => {
    if (r.status === "fulfilled") return [r.value];
    console.warn(
      `${indices[i].name}: allikas ei vastanud; vana väärtus säilib.`,
    );
    return [];
  });
  if (!fresh.length) throw new Error("Ükski turuandmete päring ei õnnestunud");
  const values = indices.flatMap((index) => {
    const quote =
      fresh.find((q) => q.id === index.id) ??
      previous.indices.find((q) => q.id === index.id);
    return quote ? [quote] : [];
  });
  await saveData(
    "markets",
    { updatedAt: new Date().toISOString(), indices: values },
    marketsSchema,
  );
  console.log(`Turud: ${fresh.length}/${indices.length} allikat kontrollitud.`);
}
main().catch((error) => {
  console.error(`Turuandmed säilitati: ${error.message}`);
  process.exitCode = 1;
});
