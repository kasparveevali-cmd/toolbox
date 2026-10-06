import { z } from "zod";
import { indices } from "../../src/config/indices";
import { dateKey } from "../../src/utils/time";
import { fetchPublic } from "../io";
const nullable = z.number().finite().nullable();
const chartSchema = z.object({
  chart: z.object({
    result: z
      .array(
        z.object({
          timestamp: z.array(z.number()),
          meta: z.object({
            currentTradingPeriod: z
              .object({ regular: z.object({ end: z.number() }) })
              .optional(),
          }),
          indicators: z.object({
            quote: z.array(z.object({ close: z.array(nullable) })),
          }),
        }),
      )
      .nullable(),
  }),
});
export function completedQuote(
  raw: unknown,
  index: (typeof indices)[number],
  now = new Date(),
) {
  const result = chartSchema.parse(raw).chart.result?.[0];
  if (!result) throw new Error("Turusümbol ei ole saadaval");
  const today = dateKey(now, index.timezone);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: index.timezone,
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const minutes =
    Number(parts.find((p) => p.type === "hour")!.value) * 60 +
    Number(parts.find((p) => p.type === "minute")!.value);
  const regularEnd = result.meta.currentTradingPeriod?.regular.end;
  const sessionEnded =
    minutes >= index.closeHour * 60 + index.closeMinute + 30 &&
    (!regularEnd ||
      dateKey(new Date(regularEnd * 1000), index.timezone) !== today ||
      now.getTime() >= (regularEnd + 1800) * 1000);
  const bars = result.timestamp
    .map((time, i) => ({
      date: dateKey(new Date(time * 1000), index.timezone),
      close: result.indicators.quote[0]?.close[i],
    }))
    .filter(
      (bar): bar is { date: string; close: number } =>
        typeof bar.close === "number" &&
        bar.close > 0 &&
        (bar.date < today || (bar.date === today && sessionEnded)),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  const last = bars.at(-1),
    previous = bars.at(-2);
  if (!last || !previous) throw new Error("Kaks lõpetatud sessiooni puuduvad");
  return {
    id: index.id,
    name: index.name,
    symbol: index.symbol,
    close: last.close,
    changePct: (last.close / previous.close - 1) * 100,
    sessionDate: last.date,
    fetchedAt: now.toISOString(),
  };
}
export async function fetchIndex(index: (typeof indices)[number]) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(index.symbol)}?interval=1d&range=1mo`;
  return completedQuote(await (await fetchPublic(url)).json(), index);
}
