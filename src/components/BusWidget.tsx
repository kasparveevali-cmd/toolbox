import {
  ArrowRight,
  ArrowRightLeft,
  BusFront,
  ArrowUpRight,
} from "lucide-react";
import { useState } from "react";
import { busConfig } from "../config/dashboard";
import { useStaticData } from "../hooks/useData";
import { busSchema } from "../types";
import { nextDepartures } from "../utils/bus";
import { clock, shortDate } from "../utils/time";
import { Empty, SectionHeading, Skeleton, Stale } from "./Shared";
export default function BusWidget({ now }: { now: Date }) {
  const [direction, setDirection] = useState(0);
  const { data, loading, error, retry } = useStaticData("bus25", busSchema);
  const route = busConfig.directions[direction];
  const departures = data ? nextDepartures(data, route.id, now) : [];
  return (
    <section className="card bus-card">
      <SectionHeading
        title="Buss 25"
        icon={<BusFront size={19} />}
        aside={<span className="route-badge">25</span>}
      />
      <div className="bus-direction">
        <div>
          <strong>{route.origin}</strong>
          <span>
            <ArrowRight size={12} />
            {route.destination}
          </span>
        </div>
        <button
          className="swap-button"
          onClick={() => setDirection((d) => 1 - d)}
          aria-label="Vaheta bussi sõidusuunda"
          title="Vaheta suunda"
        >
          <ArrowRightLeft size={17} />
        </button>
      </div>
      <span className="eyebrow departure-label">JÄRGMISED VÄLJUMISED</span>
      {loading && !data ? (
        <Skeleton />
      ) : error && !data ? (
        <Empty message="Sõiduplaani ei õnnestunud laadida." retry={retry} />
      ) : departures.length ? (
        <ol className="departures">
          {departures.map((trip, i) => {
            const minutes = Math.ceil((trip.departure - now.getTime()) / 60000);
            return (
              <li
                key={trip.departure}
                className={i === 0 ? "next-departure" : ""}
              >
                <div>
                  <time dateTime={new Date(trip.departure).toISOString()}>
                    {clock(trip.departure)}
                  </time>
                  <span className="arrival">
                    Kohal {clock(trip.arrival)}
                    {minutes >= 1440
                      ? ` · ${shortDate(new Date(trip.departure).toISOString())}`
                      : ""}
                  </span>
                </div>
                <span className="countdown">
                  {minutes === 0
                    ? "Kohe"
                    : minutes < 60
                      ? `${minutes} min`
                      : minutes < 1440
                        ? `${Math.floor(minutes / 60)} h ${minutes % 60} min`
                        : `${Math.floor(minutes / 1440)} päeva`}
                </span>
              </li>
            );
          })}
        </ol>
      ) : (
        <Empty
          message={
            data?.updatedAt
              ? "Lähiajal väljumisi ei leitud."
              : "Sõiduplaani ei õnnestunud laadida."
          }
        />
      )}
      <Stale value={data?.updatedAt ?? null} days={2} />
      <div className="bus-footer">
        <span>Graafikujärgsed ajad</span>
        <a
          href="https://www.peatus.ee/"
          target="_blank"
          rel="noopener noreferrer"
          referrerPolicy="no-referrer"
        >
          Vaata Peatus.ee-st
          <ArrowUpRight size={12} />
        </a>
      </div>
    </section>
  );
}
