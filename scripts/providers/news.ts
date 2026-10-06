import { XMLParser } from "fast-xml-parser";
import { fetchPublic } from "../io";
export const newsSources = [
  { name: "ERR", url: "https://www.err.ee/rss" },
  { name: "ERR Novaator", url: "https://novaator.err.ee/rss" },
];
export type Candidate = {
  title: string;
  description: string;
  source: string;
  url: string;
  publishedAt: string;
  section?: string;
};
export function plainText(input: string): string {
  return input
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}
export function excerpt(text: string, limit = 300) {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  const sentence = cut.match(/^.*[.!?](?:\s|$)/s)?.[0];
  return sentence?.trim() ?? cut.slice(0, cut.lastIndexOf(" ")) + "…";
}
export function parseFeed(
  xml: string,
  source: string,
  now = new Date(),
): Candidate[] {
  const parsed = new XMLParser({
    ignoreAttributes: false,
    processEntities: true,
  }).parse(xml);
  const input = parsed?.rss?.channel?.item ?? parsed?.feed?.entry;
  if (!input) throw new Error("RSS ei sisaldanud artikleid");
  const raw = Array.isArray(input) ? input : [input];
  return raw.flatMap((item: Record<string, unknown>) => {
    const title = plainText(String(item.title ?? ""));
    const link =
      typeof item.link === "string"
        ? item.link
        : (item.link as Record<string, string>)?.["@_href"];
    const date = new Date(
      String(item.pubDate ?? item.published ?? item.updated ?? ""),
    );
    if (
      !title ||
      !link?.startsWith("https://") ||
      !Number.isFinite(date.getTime()) ||
      date > now ||
      now.getTime() - date.getTime() > 7 * 86400000
    )
      return [];
    return [
      {
        title,
        description: excerpt(
          plainText(String(item.description ?? item.summary ?? "")),
        ),
        source,
        url: link,
        publishedAt: date.toISOString(),
        section: String(item.category ?? ""),
      },
    ];
  });
}
export async function fetchCandidates() {
  const results = await Promise.allSettled(
    newsSources.map(async (source) =>
      parseFeed(await (await fetchPublic(source.url)).text(), source.name),
    ),
  );
  const candidates = results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : [],
  );
  if (!candidates.length)
    throw new Error("Ükski RSS-allikas ei tagastanud sobivaid uudiseid");
  return candidates;
}
export const categories = [
  "Eesti",
  "USA turud",
  "Maailm / Euroopa",
  "Varia",
] as const;
const rules = [
  {
    positive:
      /eesti|tallinn|tartu|riigikogu|valitsus|kultuur|taristu|ühiskond/i,
    negative: /usa|ameerika|trump|venemaa|ukraina/i,
  },
  {
    positive:
      /nasdaq|wall street(?! journal)|s&p|föderaalreserv|usa.*(börs|turg|inflatsioon|majandus|tööhõive)|ameerika.*(börs|turg)|nvidia|apple|tesla|microsoft|nafta|võlakirja/i,
    negative: /laenuintress|kinnisvara|maksuvaba/i,
  },
  {
    positive:
      /euroopa|euroliit|ukraina|venemaa|saksamaa|prantsusmaa|maailm|nato|hiina|briti|soome/i,
    negative: /nasdaq|wall street|föderaalreserv/i,
  },
  {
    positive:
      /tead|kosmos|tehnol|avastus|uuring|satelliit|robot|tehisintellekt|loodus|novaator/i,
    negative: /kuulsus|horoskoop/i,
  },
];
export function selectNews(candidates: Candidate[]) {
  const used = new Set<string>();
  return categories.flatMap((category, i) => {
    const rule = rules[i];
    const ranked = candidates
      .filter(
        (c) =>
          !used.has(c.url) &&
          !/(mõrv|purjus|joobes|varastas|horoskoop|kahtlustus|kelmus|^otse)/i.test(
            c.title,
          ) &&
          (i !== 0 ||
            !c.section ||
            c.section === "Eesti" ||
            (c.section !== "Välismaa" && /eesti|tallinn|tartu/i.test(c.title))),
      )
      .map((c) => ({
        c,
        score:
          (rule.positive.test(c.title + " " + c.description + " " + c.source)
            ? 10
            : 0) +
          (i === 0 && c.section === "Eesti" ? 15 : 0) +
          (i === 3 && c.source === "ERR Novaator" ? 20 : 0) -
          (rule.negative.test(c.title) ? 12 : 0),
      }))
      .filter((x) => x.score > 0)
      .sort(
        (a, b) =>
          b.score - a.score ||
          Date.parse(b.c.publishedAt) - Date.parse(a.c.publishedAt),
      );
    const selected = ranked[0]?.c;
    if (!selected) return [];
    used.add(selected.url);
    return [
      {
        category,
        ...selected,
        summary: selected.description || "Loe täpsemalt algallikast.",
        summaryMode: "rss" as "rss" | "ai",
      },
    ];
  });
}
