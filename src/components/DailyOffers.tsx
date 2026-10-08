import { ArrowUpRight, Utensils } from "lucide-react";
import { lunchSource } from "../config/lunch";
import { useStaticData } from "../hooks/useData";
import { lunchSchema } from "../types";
import { lunchState } from "../utils/lunch";
import { SectionHeading, Skeleton } from "./Shared";
export default function DailyOffers({ now }: { now: Date }) {
  const { data, loading, error } = useStaticData("lunch", lunchSchema);
  const state = error ? "error" : data ? lunchState(data, now) : "unpublished";
  return (
    <section className="card offers-card" aria-labelledby="offers-title">
      <SectionHeading
        id="offers-title"
        title="Päeva pakkumised"
        icon={<Utensils size={19} />}
      />
      <div className="offer-restaurant">
        <h3>Lido</h3>
      </div>
      {loading && !data ? (
        <Skeleton rows={1} />
      ) : state === "available" ? (
        <ul className="offer-items">
          {data!.items.map((item, i) => (
            <li key={i}>
              <span>{item.name}</span>
              {item.price && <strong>{item.price}</strong>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="offer-message">
          {state === "error"
            ? "Päevapakkumine pole hetkel saadaval"
            : "Tänast päevapakkumist pole veel avaldatud."}
        </p>
      )}
      <a
        className="offer-link"
        href={lunchSource}
        target="_blank"
        rel="noopener noreferrer"
        referrerPolicy="no-referrer"
      >
        Vaata pakkumist
        <ArrowUpRight size={12} />
      </a>
    </section>
  );
}
