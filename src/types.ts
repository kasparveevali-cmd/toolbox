import { z } from "zod";
const timestamp = z.string().datetime();
const safeUrl = z
  .string()
  .url()
  .refine((value) => value.startsWith("https://"));
export const newsSchema = z.object({
  updatedAt: timestamp.nullable(),
  items: z.array(
    z.object({
      category: z.enum(["Eesti", "USA turud", "Maailm / Euroopa", "Varia"]),
      title: z.string(),
      summary: z.string(),
      source: z.string(),
      url: safeUrl,
      publishedAt: timestamp,
      summaryMode: z.enum(["rss", "ai"]).optional(),
    }),
  ),
  aiTip: z.object({ title: z.string(), text: z.string() }),
});
export const marketsSchema = z.object({
  updatedAt: timestamp.nullable(),
  indices: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      symbol: z.string(),
      close: z.number().positive(),
      changePct: z.number().finite(),
      sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      fetchedAt: timestamp,
    }),
  ),
});
export const busSchema = z.object({
  updatedAt: timestamp.nullable(),
  timezone: z.literal("Europe/Tallinn"),
  directions: z.array(
    z.object({
      id: z.string(),
      trips: z.array(
        z.object({
          serviceId: z.string(),
          departure: z.number().int().nonnegative(),
          arrival: z.number().int().nonnegative(),
        }),
      ),
    }),
  ),
  services: z.record(
    z.object({
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      weekdays: z.array(z.number().int().min(0).max(6)),
      exceptions: z.record(z.enum(["added", "removed"])),
    }),
  ),
});
export type NewsData = z.infer<typeof newsSchema>;
export const lunchSchema = z.object({
  checkedAt: timestamp.nullable(),
  offerDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  status: z.enum(["available", "unpublished", "error"]),
  items: z.array(
    z.object({ name: z.string().min(1), price: z.string().min(1).nullable() }),
  ),
});
export type LunchData = z.infer<typeof lunchSchema>;
export type MarketsData = z.infer<typeof marketsSchema>;
export type BusData = z.infer<typeof busSchema>;
export type WeatherHour = {
  time: number;
  temperature: number;
  precipitation: number;
  code: number;
  wind: number;
  isDay: boolean;
};
export type WeatherData = { updatedAt: string; hours: WeatherHour[] };
