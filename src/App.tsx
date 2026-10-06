import { LayoutGrid, ShieldCheck, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { dashboard } from "./config/dashboard";
import News from "./components/News";
import Markets from "./components/Markets";
import BusWidget from "./components/BusWidget";
import Weather from "./components/Weather";
import { clock } from "./utils/time";
export default function App() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: dashboard.timezone,
      hour: "numeric",
      hourCycle: "h23",
    }).format(now),
  );
  return (
    <>
      <a className="skip-link" href="#main">
        Liigu sisu juurde
      </a>
      <div className="app-shell">
        <header className="header">
          <a className="brand" href={import.meta.env.BASE_URL}>
            <span className="brand-icon">
              <LayoutGrid size={19} />
            </span>
            {dashboard.name}
            <span className="personal-label">ISIKLIK</span>
          </a>
          <div className="header-time">
            <span>
              {new Intl.DateTimeFormat("et-EE", {
                timeZone: dashboard.timezone,
                weekday: "long",
                day: "numeric",
                month: "long",
              }).format(now)}
            </span>
            <span className="time-divider" />
            <time>{clock(now)}</time>
            <span className="timezone-label">TALLINN</span>
          </div>
        </header>
        <main id="main">
          <div className="page-intro">
            <div>
              <span className="eyebrow">KÕIK OLULINE ÜHES KOHAS</span>
              <h1>
                {hour < 11
                  ? "Tere hommikust."
                  : hour < 18
                    ? "Head päeva."
                    : "Tere õhtust."}
              </h1>
              <p>Väike ülevaade. Selgem päev.</p>
            </div>
            <span className="today-badge">
              <span className="status-dot" />
              Sinu tänane vaade
            </span>
          </div>
          <div className="dashboard-grid">
            <div className="main-column">
              <News />
              <Markets />
            </div>
            <aside className="sidebar">
              <BusWidget now={now} />
              <Weather now={now} />
            </aside>
          </div>
        </main>
        <footer className="footer">
          <span>
            <span className="footer-mark">
              <LayoutGrid size={13} />
            </span>
            {dashboard.name}
            <span className="footer-divider">/</span>Vähem müra, rohkem selgust.
          </span>
          <span className="privacy-note">
            <ShieldCheck size={13} />
            Külastaja andmeid ei salvestata
          </span>
        </footer>
        <details className="privacy-details">
          <summary>Privaatsus ja andmeallikad</summary>
          <p>
            Sait ei kasuta kontosid, küpsiseid, analüütikat ega brauseri
            püsimälu. Sõidusuuna valik kaob lehe värskendamisel. Uudised,
            börsiandmed ja sõiduplaan on avalikud staatilised andmed.
          </p>
          <p>
            Ilmapäring edastab Open-Meteole ainult kahe ette määratud koha
            koordinaadid. Nagu iga veebipäringu puhul, näevad veebimajutaja ja
            ilmateenuse pakkuja ühenduse IP-aadressi ning võivad oma reeglite
            järgi hoida serverilogisid. Rakendus ei kogu ega salvesta neid.{" "}
            <a
              href="https://open-meteo.com/en/terms"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open-Meteo tingimused
              <ArrowUpRight size={11} />
            </a>
          </p>
        </details>
      </div>
    </>
  );
}
