import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
const prohibited =
  /localStorage|sessionStorage|document\.cookie|indexedDB|sendBeacon|googletagmanager|google-analytics|sk-[a-zA-Z0-9_-]{20,}|OPENAI_API_KEY|api\.openai\.com/;
async function audit(dir: string) {
  for (const file of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, file.name);
    if (file.isDirectory()) await audit(path);
    else if (
      /\.(js|html|json)$/.test(file.name) &&
      prohibited.test(await readFile(path, "utf8"))
    )
      throw new Error(`Keelatud salvestamine või saladus failis ${path}`);
  }
}
await audit("dist");
const html = await readFile("dist/index.html", "utf8");
if (!html.includes("/toolbox/assets/"))
  throw new Error("GitHub Pages base path on vale");
console.log(
  "Ehitatud veebis pole püsimälu, jälgimisskripte ega OpenAI võtmeid. Pagesi baastee on õige.",
);
