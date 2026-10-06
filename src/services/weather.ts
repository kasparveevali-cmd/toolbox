import { z } from "zod";
import type { WeatherData, WeatherHour } from "../types";
const numbers = z.array(z.number().finite());
const schema = z.object({
  hourly: z.object({
    time: numbers,
    temperature_2m: numbers,
    precipitation_probability: numbers,
    weather_code: numbers,
    wind_speed_10m: numbers,
    is_day: numbers,
  }),
});
export function nextWeatherHours(hours: WeatherHour[], now: Date) {
  return hours.filter((h) => h.time > now.getTime()).slice(0, 8);
}
export async function fetchWeather(
  latitude: number,
  longitude: number,
  signal: AbortSignal,
): Promise<WeatherData> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    hourly:
      "temperature_2m,precipitation_probability,weather_code,wind_speed_10m,is_day",
    timezone: "Europe/Tallinn",
    timeformat: "unixtime",
    forecast_days: "3",
  }).toString();
  const response = await fetch(url, {
    signal,
    credentials: "omit",
    cache: "no-store",
    referrerPolicy: "no-referrer",
  });
  if (!response.ok) throw new Error("Ilmateenus ei vasta");
  const { hourly: h } = schema.parse(await response.json());
  if (
    [
      h.temperature_2m,
      h.precipitation_probability,
      h.weather_code,
      h.wind_speed_10m,
      h.is_day,
    ].some((a) => a.length !== h.time.length)
  )
    throw new Error("Puudulik ilmaprognoos");
  return {
    updatedAt: new Date().toISOString(),
    hours: h.time.map((t, i) => ({
      time: t * 1000,
      temperature: h.temperature_2m[i],
      precipitation: h.precipitation_probability[i],
      code: h.weather_code[i],
      wind: h.wind_speed_10m[i],
      isDay: h.is_day[i] === 1,
    })),
  };
}
