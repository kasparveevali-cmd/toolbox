import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  Moon,
  Snowflake,
  Sun,
  Wind,
} from "lucide-react";
import { useCallback } from "react";
import { locations } from "../config/locations";
import { useResource } from "../hooks/useData";
import { fetchWeather, nextWeatherHours } from "../services/weather";
import { clock } from "../utils/time";
import { Empty, SectionHeading, Skeleton } from "./Shared";
export function weatherDescription(code: number) {
  if (code === 0) return "Selge";
  if (code <= 2) return "Osaliselt pilves";
  if (code === 3) return "Pilves";
  if (code === 45 || code === 48) return "Udu";
  if (code === 56 || code === 57) return "Jäätuv uduvihm";
  if (code === 66 || code === 67) return "Jäätuv vihm";
  if (code >= 51 && code <= 57) return "Uduvihm";
  if (code >= 61 && code <= 67) return "Vihm";
  if (code === 85 || code === 86) return "Lumehood";
  if (code >= 71 && code <= 77) return "Lumi";
  if (code >= 80 && code <= 82) return "Hoovihm";
  if (code >= 95) return "Äike";
  return "Ilmaprognoos";
}
export function WeatherIcon({
  code,
  isDay = true,
  size = 21,
}: {
  code: number;
  isDay?: boolean;
  size?: number;
}) {
  const Icon =
    code === 0
      ? isDay
        ? Sun
        : Moon
      : code <= 2
        ? isDay
          ? CloudSun
          : Cloud
        : code === 3
          ? Cloud
          : code === 45 || code === 48
            ? CloudFog
            : code >= 51 && code <= 57
              ? CloudDrizzle
              : code >= 61 && code <= 67
                ? CloudRain
                : code >= 71 && code <= 77
                  ? CloudSnow
                  : code === 85 || code === 86
                    ? Snowflake
                    : code >= 80 && code <= 82
                      ? CloudRain
                      : code >= 95
                        ? CloudLightning
                        : Cloud;
  return <Icon size={size} aria-hidden="true" />;
}
function LocationWeather({
  location,
  now,
}: {
  location: (typeof locations)[number];
  now: Date;
}) {
  const load = useCallback(
    (signal: AbortSignal) =>
      fetchWeather(location.latitude, location.longitude, signal),
    [location.latitude, location.longitude],
  );
  const { data, loading, error, retry } = useResource(load);
  const hours = data ? nextWeatherHours(data.hours, now) : [];
  return (
    <div className="weather-location">
      <div className="location-heading">
        <h3>{location.name}</h3>
        <span className="location-dot" />
      </div>
      {loading && !data ? (
        <Skeleton rows={2} />
      ) : error && !data ? (
        <Empty message="Ilma ei õnnestunud laadida." retry={retry} />
      ) : hours.length === 8 ? (
        <>
          <div className="weather-overview">
            <WeatherIcon
              code={hours[0].code}
              isDay={hours[0].isDay}
              size={30}
            />
            <strong>{Math.round(hours[0].temperature)}°</strong>
            <div>
              <span>{weatherDescription(hours[0].code)}</span>
              <small>Alates {clock(hours[0].time)}</small>
            </div>
          </div>
          <div
            className="hourly-scroll"
            tabIndex={0}
            role="region"
            aria-label={`${location.name}: järgmise kaheksa tunni ilm`}
          >
            <div className="weather-hours">
              {hours.map((hour) => (
                <div className="weather-hour" key={hour.time}>
                  <time dateTime={new Date(hour.time).toISOString()}>
                    {clock(hour.time)}
                  </time>
                  <span
                    className="hour-icon"
                    title={weatherDescription(hour.code)}
                  >
                    <WeatherIcon code={hour.code} isDay={hour.isDay} />
                    <span className="sr-only">
                      {weatherDescription(hour.code)}
                    </span>
                  </span>
                  <strong>{Math.round(hour.temperature)}°</strong>
                  <span className="rain">
                    <Droplets size={9} />
                    {hour.precipitation}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="weather-detail">
            <span>
              <Wind size={12} />
              {Math.round(hours[0].wind)} km/h
            </span>
            <span>Uuendatud {clock(new Date(data!.updatedAt))}</span>
          </div>
        </>
      ) : (
        <Empty message="Prognoos vajab värskendamist." retry={retry} />
      )}
    </div>
  );
}
export default function Weather({ now }: { now: Date }) {
  return (
    <section className="card weather-card">
      <SectionHeading
        title="Ilm"
        icon={<CloudSun size={19} />}
        aside={<span className="meta">Järgmised 8 tundi</span>}
      />
      {locations.map((location) => (
        <LocationWeather key={location.id} location={location} now={now} />
      ))}
      <p className="weather-source">
        Prognoos:{" "}
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noopener noreferrer"
          referrerPolicy="no-referrer"
        >
          Open-Meteo
        </a>
      </p>
    </section>
  );
}
