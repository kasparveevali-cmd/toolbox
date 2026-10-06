import { ArrowUpRight, Newspaper, Sparkles } from "lucide-react";
import { useStaticData } from "../hooks/useData";
import { newsSchema } from "../types";
import { clock, shortDate, updatedLabel } from "../utils/time";
import { Empty, SectionHeading, Skeleton, Stale } from "./Shared";
const categories = ["Eesti", "USA turud", "Maailm / Euroopa", "Varia"] as const;
export default function News() {
  const { data, loading, error, retry } = useStaticData("news", newsSchema);
  return (
    <section className="news-section" aria-labelledby="news-title">
      <SectionHeading
        id="news-title"
        title="Uudised"
        icon={<Newspaper size={19} />}
        aside={<span className="section-meta">Päeva oluline, lühidalt</span>}
      />
      <div className="card news-card">
        <div className="card-toolbar">
          <span className="eyebrow">
            <span className="status-dot" />
            SINU PÄEVAÜLEVAADE
          </span>
          <span className="meta">
            {data?.updatedAt ? updatedLabel(data.updatedAt) : "Neli vaatenurka"}
          </span>
        </div>
        {loading && !data ? (
          <Skeleton rows={4} />
        ) : error && !data ? (
          <Empty message="Uudiseid ei õnnestunud laadida." retry={retry} />
        ) : (
          <div className="news-list">
            {categories.map((category, i) => {
              const item = data?.items.find((n) => n.category === category);
              return (
                <article className="news-item" key={category}>
                  <div className="news-marker">
                    <span className={`category category-${i}`}>{category}</span>
                    <span className="article-number">0{i + 1}</span>
                  </div>
                  {item ? (
                    <div className="article-content">
                      <h3>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          referrerPolicy="no-referrer"
                        >
                          {item.title}
                          <ArrowUpRight size={16} />
                        </a>
                      </h3>
                      <p>{item.summary}</p>
                      <a
                        className="source-link"
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        referrerPolicy="no-referrer"
                      >
                        {item.source}
                        <span>·</span>
                        <time dateTime={item.publishedAt}>
                          {shortDate(item.publishedAt)} ·{" "}
                          {clock(new Date(item.publishedAt))}
                        </time>
                        <ArrowUpRight size={12} />
                      </a>
                    </div>
                  ) : (
                    <div className="article-content">
                      <h3>Ootame värskeid uudiseid</h3>
                      <p>Selle kategooria uudis pole praegu saadaval.</p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
        {error && data && (
          <p className="inline-note">
            Andmeid ei õnnestunud värskendada. Kuvame viimase ülevaate.
          </p>
        )}
        <Stale value={data?.updatedAt ?? null} />
      </div>
      <aside className="ai-tip">
        <span className="tip-icon">
          <Sparkles size={18} />
        </span>
        <div>
          <span className="eyebrow">AI NIPP</span>
          <p>
            {data?.aiTip.text ??
              "Lase AI-l võrrelda kahte dokumenti: palu esitada muudatused tabelina ning lisada iga väite juurde viide algtekstile. Kontrolli olulisemad erinevused ise üle."}
          </p>
        </div>
      </aside>
    </section>
  );
}
