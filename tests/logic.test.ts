import { test } from "node:test";
import assert from "node:assert/strict";
import type { BusData, WeatherHour } from "../src/types";
import { dateKey, zonedSeconds } from "../src/utils/time";
import { nextDepartures, serviceActive } from "../src/utils/bus";
import { nextWeatherHours } from "../src/services/weather";
import { completedQuote } from "../scripts/providers/markets";
import { indices } from "../src/config/indices";
import { parseFeed, selectNews, plainText } from "../scripts/providers/news";
import type { Candidate } from "../scripts/providers/news";
const service = {
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  weekdays: [1, 2, 3, 4, 5],
  exceptions: { "2026-10-06": "removed", "2026-10-10": "added" } as Record<
    string,
    "added" | "removed"
  >,
};
test("Calendar respects weekdays, additions, cancellations, and bounds", () => {
  assert.equal(serviceActive(service, "2026-10-05"), true);
  assert.equal(serviceActive(service, "2026-10-06"), false);
  assert.equal(serviceActive(service, "2026-10-10"), true);
  assert.equal(serviceActive(service, "2026-10-11"), false);
  assert.equal(serviceActive(service, "2027-01-04"), false);
});
test("Previous service day times above 24h and direction are handled", () => {
  const data: BusData = {
    updatedAt: null,
    timezone: "Europe/Tallinn",
    services: { s: { ...service, exceptions: {} } },
    directions: [
      {
        id: "outbound",
        trips: [
          { serviceId: "s", departure: 25 * 3600, arrival: 26 * 3600 },
          { serviceId: "s", departure: 9 * 3600, arrival: 10 * 3600 },
          { serviceId: "s", departure: 10 * 3600, arrival: 11 * 3600 },
        ],
      },
      {
        id: "inbound",
        trips: [{ serviceId: "s", departure: 11 * 3600, arrival: 12 * 3600 }],
      },
    ],
  };
  const now = new Date("2026-10-06T21:45:00Z"); // 00:45 Tallinn Wednesday
  const next = nextDepartures(data, "outbound", now);
  assert.equal(next.length, 3);
  assert.equal(
    new Date(next[0].departure).toISOString(),
    "2026-10-06T22:00:00.000Z",
  );
  assert.equal(
    new Date(next[1].departure).toISOString(),
    "2026-10-07T06:00:00.000Z",
  );
  assert.equal(
    new Date(nextDepartures(data, "inbound", now)[0].departure).toISOString(),
    "2026-10-07T08:00:00.000Z",
  );
});
test("GTFS noon anchor follows Tallinn DST and date rollover", () => {
  assert.equal(dateKey(new Date("2026-10-05T22:15:00Z")), "2026-10-06");
  assert.equal(
    new Date(zonedSeconds("2026-03-29", 4 * 3600)).toISOString(),
    "2026-03-29T01:00:00.000Z",
  );
  assert.equal(
    new Date(zonedSeconds("2026-10-25", 4 * 3600)).toISOString(),
    "2026-10-25T02:00:00.000Z",
  );
});
test("Weather shows 8 future full hours across midnight, without current partial hour", () => {
  const start = Date.parse("2026-10-06T19:00:00Z");
  const hours: WeatherHour[] = Array.from({ length: 15 }, (_, i) => ({
    time: start + i * 3600000,
    temperature: 7,
    precipitation: 20,
    code: 2,
    wind: 5,
    isDay: false,
  }));
  const next = nextWeatherHours(hours, new Date("2026-10-06T20:43:00Z"));
  assert.equal(next.length, 8);
  assert.equal(next[0].time, Date.parse("2026-10-06T21:00:00Z"));
  assert.equal(next.at(-1)!.time, Date.parse("2026-10-07T04:00:00Z"));
});
function chart(closes: number[]) {
  return {
    chart: {
      result: [
        {
          meta: {},
          timestamp: [
            "2026-10-01T13:30:00Z",
            "2026-10-02T13:30:00Z",
            "2026-10-05T13:30:00Z",
          ].map((s) => Date.parse(s) / 1000),
          indicators: { quote: [{ close: closes }] },
        },
      ],
    },
  };
}
test("Markets ignore active session, find last completed session over weekend, and calculate signs", () => {
  const index = indices[0];
  const active = completedQuote(
    chart([100, 102, 99]),
    index,
    new Date("2026-10-05T17:00:00Z"),
  );
  assert.equal(active.sessionDate, "2026-10-02");
  assert.equal(active.changePct, 2.0000000000000018);
  const ended = completedQuote(
    chart([100, 102, 99]),
    index,
    new Date("2026-10-05T21:00:00Z"),
  );
  assert.equal(ended.sessionDate, "2026-10-05");
  assert.ok(ended.changePct < 0);
  const sunday = completedQuote(
    chart([100, 102, 99]),
    index,
    new Date("2026-10-04T15:00:00Z"),
  );
  assert.equal(sunday.sessionDate, "2026-10-02");
});
test("RSS parsing rejects unsafe links and stale articles, preserves publication dates", () => {
  const xml =
    "<rss><channel><item><title>Eesti teadlased avaldasid uuringu</title><link>https://www.err.ee/a</link><description>&lt;p&gt;Uuringu tulemused.&lt;/p&gt;</description><pubDate>Tue, 06 Oct 2026 10:00:00 GMT</pubDate></item><item><title>Unsafe</title><link>javascript:alert(1)</link><pubDate>Tue, 06 Oct 2026 10:00:00 GMT</pubDate></item></channel></rss>";
  const candidates = parseFeed(xml, "ERR", new Date("2026-10-06T15:00:00Z"));
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].description, "Uuringu tulemused.");
  assert.equal(selectNews(candidates).length, 1);
  assert.equal(plainText("<script>bad()</script><b>Hea</b>"), "Hea");
});
test("Foreign governments are not classified as Estonia and science uses Novaator", () => {
  const article = (title:string,section:string,url:string,source="ERR"):Candidate => ({title,section,url,source,description:"Valitsus avaldas uuringu.",publishedAt:"2026-10-06T10:00:00Z"});
  const selected=selectNews([
    article("Bulgaaria valitsus kinnitas otsust","Välismaa","https://www.err.ee/foreign"),
    article("Eesti parlament arutab uut ettepanekut","Eesti","https://www.err.ee/estonia"),
    article("USA börside investorid jälgivad Föderaalreservi","Majandus","https://www.err.ee/markets"),
    article("Nobeli preemia sai uus teadusavastus","Teaduselu","https://novaator.err.ee/science","ERR Novaator"),
  ]);
  assert.equal(selected.find(item=>item.category==='Eesti')?.url,'https://www.err.ee/estonia');
  assert.equal(selected.find(item=>item.category==='USA turud')?.url,'https://www.err.ee/markets');
  assert.equal(selected.find(item=>item.category==='Varia')?.source,'ERR Novaator');
  assert.equal(new Set(selected.map(item=>item.url)).size,selected.length);
});
