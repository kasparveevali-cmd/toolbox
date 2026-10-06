import type { BusData } from "../types";
import { dateKey, shiftDate, zonedSeconds } from "./time";
export function serviceActive(
  service: BusData["services"][string],
  day: string,
) {
  if (service.exceptions[day]) return service.exceptions[day] === "added";
  return (
    day >= service.startDate &&
    day <= service.endDate &&
    service.weekdays.includes(new Date(day + "T12:00:00Z").getUTCDay())
  );
}
export function nextDepartures(data: BusData, direction: string, now: Date) {
  const trips = data.directions.find((d) => d.id === direction)?.trips ?? [];
  const result: { departure: number; arrival: number }[] = [];
  const maxSeconds = trips.reduce(
    (max, t) => Math.max(max, t.departure),
    86400,
  );
  for (let offset = -Math.ceil(maxSeconds / 86400); offset <= 7; offset++) {
    const day = shiftDate(dateKey(now), offset);
    for (const trip of trips) {
      const service = data.services[trip.serviceId];
      if (!service || !serviceActive(service, day)) continue;
      const departure = zonedSeconds(day, trip.departure);
      if (departure >= now.getTime())
        result.push({ departure, arrival: zonedSeconds(day, trip.arrival) });
    }
  }
  return [
    ...new Map(
      result
        .sort((a, b) => a.departure - b.departure)
        .map((t) => [t.departure, t]),
    ).values(),
  ].slice(0, 3);
}
