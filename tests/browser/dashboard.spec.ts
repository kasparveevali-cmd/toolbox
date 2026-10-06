import { test, expect, type Page } from "@playwright/test";
// Deterministic test data only: never shipped in public/data or in the production bundle.
const now = "2026-10-06T20:43:00Z"; // 23:43 in Tallinn
const news = {
  updatedAt: now,
  items: [
    {
      category: "Eesti",
      title: "Eesti teadlased uurivad uusi võimalusi",
      summary:
        "Testandmed kinnitavad eestikeelse uudisekaardi toimimist. Algallika link avaneb eraldi vahekaardil.",
      source: "ERR",
      url: "https://www.err.ee/test-eesti",
      publishedAt: now,
    },
    {
      category: "USA turud",
      title: "USA börsid lõpetasid kauplemispäeva tõusuga",
      summary:
        "See tekst on brauseritesti andmestik. Turuülevaates kuvatakse vaid lõpetatud kauplemissessioonid.",
      source: "ERR",
      url: "https://www.err.ee/test-usa",
      publishedAt: now,
    },
    {
      category: "Maailm / Euroopa",
      title: "Euroopa investeerib uutesse ühendustesse",
      summary:
        "Test kontrollib uudise paigutust ja loetavust eri ekraanisuurustel.",
      source: "ERR",
      url: "https://www.err.ee/test-world",
      publishedAt: now,
    },
    {
      category: "Varia",
      title: "Uuring avab kosmose kohta uue vaatenurga",
      summary:
        "Katseandmed ei ole avaldatav uudis. Neid kasutatakse ainult kasutajaliidese testimiseks.",
      source: "ERR Novaator",
      url: "https://novaator.err.ee/test-varia",
      publishedAt: now,
    },
  ],
  aiTip: {
    title: "AI nipp",
    text: "Lase AI-l võrrelda kahte dokumenti ja esitada erinevused tabelina. Palu lisada iga muudatuse juurde viide algtekstile.",
  },
};
const markets = {
  updatedAt: now,
  indices: [
    {
      id: "sp500",
      name: "S&P 500",
      symbol: "^GSPC",
      close: 6000,
      changePct: 0.82,
      sessionDate: "2026-10-05",
      fetchedAt: now,
    },
    {
      id: "nasdaq100",
      name: "Nasdaq-100",
      symbol: "^NDX",
      close: 21000,
      changePct: -0.34,
      sessionDate: "2026-10-05",
      fetchedAt: now,
    },
  ],
};
const bus = {
  updatedAt: now,
  timezone: "Europe/Tallinn",
  services: {
    s: {
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      exceptions: {},
    },
  },
  directions: [
    {
      id: "outbound",
      trips: [
        { serviceId: "s", departure: 24 * 3600, arrival: 24 * 3600 + 1800 },
        { serviceId: "s", departure: 25 * 3600, arrival: 25 * 3600 + 1800 },
        { serviceId: "s", departure: 26 * 3600, arrival: 26 * 3600 + 1800 },
      ],
    },
    {
      id: "inbound",
      trips: [
        {
          serviceId: "s",
          departure: 24 * 3600 + 600,
          arrival: 24 * 3600 + 2400,
        },
        {
          serviceId: "s",
          departure: 25 * 3600 + 600,
          arrival: 25 * 3600 + 2400,
        },
        {
          serviceId: "s",
          departure: 26 * 3600 + 600,
          arrival: 26 * 3600 + 2400,
        },
      ],
    },
  ],
};
const weather = {
  hourly: {
    time: Array.from(
      { length: 15 },
      (_, i) => Date.parse("2026-10-06T20:00:00Z") / 1000 + i * 3600,
    ),
    temperature_2m: Array(15).fill(7),
    precipitation_probability: Array(15).fill(35),
    weather_code: Array(15).fill(3),
    wind_speed_10m: Array(15).fill(8),
    is_day: Array(15).fill(0),
  },
};
async function fixtures(page: Page) {
  await page.clock.install({ time: new Date(now) });
  await page.route("**/data/*.json", (route) => {
    const name = route.request().url().split("/").pop();
    return route.fulfill({
      json:
        name === "news.json" ? news : name === "markets.json" ? markets : bus,
    });
  });
  await page.route("https://api.open-meteo.com/**", (route) =>
    route.fulfill({ json: weather }),
  );
}
test("News, positive/negative markets, midnight weather, and responsive layout", async ({
  page,
}, testInfo) => {
  await fixtures(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("./");
  await expect(
    page.getByRole("heading", { name: news.items[0].title }),
  ).toBeVisible();
  await expect(page.locator(".positive")).toContainText("+0,82%");
  await expect(page.locator(".negative")).toContainText("-0,34%");
  await expect(page.locator(".weather-hour")).toHaveCount(16);
  await expect(page.locator(".weather-hour time").first()).toHaveText("00:00");
  await expect(page.locator(".weather-hour time").nth(7)).toHaveText("07:00");
  const bounds = await page.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
    overflow: [...document.querySelectorAll("body *")]
      .map((e) => ({
        className: e.className,
        right: e.getBoundingClientRect().right,
      }))
      .filter((e) => e.right > innerWidth),
  }));
  if (bounds.scroll > bounds.width) console.log(JSON.stringify(bounds));
  expect(bounds.scroll).toBe(bounds.width);
  for (const link of await page.locator(".article-content a").all()) {
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
  if (testInfo.project.name === "mobile") {
    const newsTop = await page.locator(".news-section").boundingBox(),
      marketTop = await page.locator(".markets-section").boundingBox(),
      busTop = await page.locator(".bus-card").boundingBox(),
      weatherTop = await page.locator(".weather-card").boundingBox();
    expect(
      newsTop!.y < marketTop!.y &&
        marketTop!.y < busTop!.y &&
        busTop!.y < weatherTop!.y,
    ).toBeTruthy();
  }
  expect(errors).toEqual([]);
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-dashboard.png`,
    fullPage: true,
  });
});
test("Three departures, direction reset after refresh, and no browser persistence", async ({
  page,
  context,
}) => {
  await fixtures(page);
  await page.goto("./");
  await expect(page.locator(".departures li")).toHaveCount(3);
  await expect(page.locator(".departures time").first()).toHaveText("00:00");
  await page.getByRole("button", { name: "Vaheta bussi sõidusuunda" }).click();
  await expect(page.locator(".bus-direction strong")).toHaveText(
    "Vana-Rannamõisa tee",
  );
  await expect(page.locator(".departures time").first()).toHaveText("00:10");
  await page.reload();
  await expect(page.locator(".bus-direction strong")).toHaveText("Lennuki");
  expect(await context.cookies()).toEqual([]);
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
    })),
  ).toEqual({ local: 0, session: 0 });
  expect(await page.evaluate(async () => await indexedDB.databases())).toEqual(
    [],
  );
});
test("A failed weather location is isolated and static-data failure has a retry", async ({
  page,
}) => {
  await fixtures(page);
  await page.route("https://api.open-meteo.com/**", (route) =>
    route.request().url().includes("latitude=59.4282")
      ? route.fulfill({ status: 503, body: "Unavailable" })
      : route.fulfill({ json: weather }),
  );
  await page.route("**/data/news.json", (route) =>
    route.fulfill({ status: 503, body: "Unavailable" }),
  );
  await page.goto("./");
  await expect(page.getByText("Uudiseid ei õnnestunud laadida.")).toBeVisible();
  await expect(page.getByText("Ilma ei õnnestunud laadida.")).toBeVisible();
  await expect(page.locator(".weather-hour")).toHaveCount(8);
  await page.route("**/data/news.json", (route) =>
    route.fulfill({ json: news }),
  );
  await page
    .locator(".news-card")
    .getByRole("button", { name: "Proovi uuesti" })
    .click();
  await expect(
    page.getByRole("heading", { name: news.items[0].title }),
  ).toBeVisible();
});
test("Empty initial deployment shows honest no-data states", async ({
  page,
}) => {
  await page.route("**/data/*.json", (route) =>
    route.fulfill({
      json: route.request().url().endsWith("news.json")
        ? { updatedAt: null, items: [], aiTip: news.aiTip }
        : route.request().url().endsWith("markets.json")
          ? { updatedAt: null, indices: [] }
          : {
              updatedAt: null,
              timezone: "Europe/Tallinn",
              directions: [],
              services: {},
            },
    }),
  );
  await page.route("https://api.open-meteo.com/**", (route) => route.abort());
  await page.goto("./");
  await expect(page.getByText("Ootame värskeid uudiseid")).toHaveCount(4);
  await expect(page.getByText("Andmed puuduvad", { exact: true })).toHaveCount(
    7,
  );
  await expect(
    page.getByText("Sõiduplaani ei õnnestunud laadida."),
  ).toBeVisible();
});
