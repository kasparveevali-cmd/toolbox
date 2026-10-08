import type { LunchData } from "../types";
import { dateKey } from "./time";
export function lunchState(data: LunchData, now: Date) {
  if (data.status === "error") return "error";
  if (
    data.status !== "available" ||
    data.offerDate !== dateKey(now) ||
    !data.items.length
  )
    return "unpublished";
  return "available";
}
export function isLunchMorning(now: Date) {
  const local = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Tallinn",
    weekday: "short",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const weekday = local.find((p) => p.type === "weekday")!.value;
  const hour = Number(local.find((p) => p.type === "hour")!.value);
  return !["Sat", "Sun"].includes(weekday) && hour >= 8 && hour < 12;
}
