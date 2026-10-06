import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  ChartNoAxesCombined,
} from "lucide-react";
import { indices } from "../config/indices";
import { useStaticData } from "../hooks/useData";
import { marketsSchema } from "../types";
import { shortDate, updatedLabel } from "../utils/time";
import { Empty, SectionHeading, Skeleton } from "./Shared";
export default function Markets() {
  const { data, loading, error, retry } = useStaticData(
    "markets",
    marketsSchema,
  );
  return (
    <section className="markets-section">
      <SectionHeading
        title="Turud"
        icon={<ChartNoAxesCombined size={19} />}
        aside={
          <span className="section-meta">Viimased lõppenud sessioonid</span>
        }
      />
      {loading && !data ? (
        <div className="card">
          <Skeleton rows={2} />
        </div>
      ) : error && !data ? (
        <div className="card">
          <Empty message="Turuandmeid ei õnnestunud laadida." retry={retry} />
        </div>
      ) : (
        <div className="market-grid">
          {indices.map((index) => {
            const quote = data?.indices.find((q) => q.id === index.id);
            const stale =
              quote && Date.now() - Date.parse(quote.fetchedAt) > 3 * 86400000;
            return (
              <article className="card market-card" key={index.id}>
                <div className="market-top">
                  <span>{index.region}</span>
                  <ChartNoAxesCombined size={14} />
                </div>
                <h3>{index.name}</h3>
                {quote ? (
                  <>
                    <div className="market-value">
                      {new Intl.NumberFormat("et-EE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(quote.close)}
                    </div>
                    <div
                      className={`market-change ${quote.changePct > 0 ? "positive" : quote.changePct < 0 ? "negative" : "neutral"}`}
                    >
                      {quote.changePct > 0 ? (
                        <ArrowUpRight size={15} />
                      ) : quote.changePct < 0 ? (
                        <ArrowDownRight size={15} />
                      ) : (
                        <Minus size={15} />
                      )}
                      <span>
                        {quote.changePct > 0 ? "+" : ""}
                        {quote.changePct.toFixed(2).replace(".", ",")}%
                      </span>
                    </div>
                    <p className="market-date">
                      {shortDate(quote.sessionDate)}
                      {stale ? " · aegunud" : ""}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="unavailable">Andmed puuduvad</div>
                    <p className="market-date">Ootame allika uuendust</p>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}
      <p className="footnote">
        Päevane muutus eelmise sulgemise suhtes.{" "}
        {data?.updatedAt && updatedLabel(data.updatedAt)}
        {error ? " · Värskendamine ebaõnnestus." : ""}
      </p>
    </section>
  );
}
