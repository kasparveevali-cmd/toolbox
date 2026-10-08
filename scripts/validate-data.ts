import { busSchema, marketsSchema, newsSchema, lunchSchema } from "../src/types";
import { readData } from "./io";
await readData("news", newsSchema);
await readData("markets", marketsSchema);
await readData("bus25", busSchema);
await readData("lunch", lunchSchema);
console.log("Kõik avalikud andmefailid vastavad skeemile.");
