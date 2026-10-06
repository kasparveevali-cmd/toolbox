import { busSchema, marketsSchema, newsSchema } from "../src/types";
import { readData } from "./io";
await readData("news", newsSchema);
await readData("markets", marketsSchema);
await readData("bus25", busSchema);
console.log("Kõik avalikud andmefailid vastavad skeemile.");
