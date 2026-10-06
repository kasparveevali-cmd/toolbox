export const zone = "Europe/Tallinn";
export function dateKey(date: Date, timezone = zone): string {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return `${p.find((x) => x.type === "year")!.value}-${p.find((x) => x.type === "month")!.value}-${p.find((x) => x.type === "day")!.value}`;
}
export function shiftDate(key: string, days: number) {
  const date = new Date(key + "T12:00:00Z");
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
export function zonedSeconds(key: string, seconds: number): number {
  // GTFS specifies seconds from service-day noon minus 12h; this also handles DST transitions.
  const noon = Date.parse(key + "T12:00:00Z");
  const local = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    hour: "numeric",
    hourCycle: "h23",
  }).format(new Date(noon));
  return noon - (Number(local) - 12) * 3600000 - 12 * 3600000 + seconds * 1000;
}
export const clock = (date: Date | number) =>
  new Intl.DateTimeFormat("et-EE", {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
export const shortDate = (date: string) =>
  new Intl.DateTimeFormat("et-EE", {
    timeZone: zone,
    day: "numeric",
    month: "short",
  }).format(new Date(date.length === 10 ? date + "T12:00:00Z" : date));
export function updatedLabel(value: string | null) {
  return value
    ? `Uuendatud ${shortDate(value)} · ${clock(new Date(value))}`
    : "Andmed pole veel saabunud";
}
