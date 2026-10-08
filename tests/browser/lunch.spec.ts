import { test, expect } from "@playwright/test";
import { lunchSource } from "../../src/config/lunch";
const menu = {
  checkedAt: "2026-10-08T06:00:00Z",
  offerDate: "2026-10-08",
  status: "available",
  items: [
    { name: "Testiroog salatiga", price: "5,90 €" },
    { name: "Testisupp", price: null },
  ],
};
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-08T08:00:00Z") });
  await page.route("https://api.open-meteo.com/**", (r) => r.abort());
});
test("Offer card is directly above the bus on both layouts, without address or persistent data", async ({
  page,
  context,
}, testInfo) => {
  await page.route("**/data/lunch.json", (r) => r.fulfill({ json: menu }));
  await page.goto("./");
  const card = page.locator(".offers-card");
  await expect(
    card.getByRole("heading", { name: "Päeva pakkumised" }),
  ).toBeVisible();
  await expect(
    card.getByRole("heading", { name: "Lido", exact: true }),
  ).toBeVisible();
  await expect(card.getByText("Testiroog salatiga")).toBeVisible();
  await expect(card.getByText("5,90 €")).toBeVisible();
  await expect(card.getByText("Testisupp")).toBeVisible();
  expect(await card.innerText()).not.toMatch(/Ülemiste|Suur-Sõjamäe|https?:/);
  const link = card.getByRole("link", { name: "Vaata pakkumist" });
  await expect(link).toHaveAttribute("href", lunchSource);
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  expect(
    await card.evaluate((e) =>
      e.nextElementSibling?.classList.contains("bus-card"),
    ),
  ).toBe(true);
  const offerBox = await card.boundingBox(),
    busBox = await page.locator(".bus-card").boundingBox();
  expect(offerBox!.y + offerBox!.height).toBeLessThan(busBox!.y);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(await context.cookies()).toEqual([]);
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-offers.png`,
    fullPage: true,
  });
});
test("Old and unverified menus are hidden, while a source error has its own message", async ({
  page,
}) => {
  for (const data of [
    { ...menu, offerDate: "2026-10-07" },
    { ...menu, offerDate: null },
    { ...menu, status: "unpublished", items: [] },
  ]) {
    await page.route("**/data/lunch.json", (r) => r.fulfill({ json: data }));
    await page.goto("./");
    await expect(
      page
        .locator(".offers-card")
        .getByText("Tänast päevapakkumist pole veel avaldatud.", {
          exact: true,
        }),
    ).toBeVisible();
    await expect(page.locator(".offer-items")).toHaveCount(0);
  }
  await page.route("**/data/lunch.json", (r) =>
    r.fulfill({ json: { ...menu, status: "error", items: [] } }),
  );
  await page.reload();
  await expect(
    page
      .locator(".offers-card")
      .getByText("Päevapakkumine pole hetkel saadaval", { exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".offers-card").getByRole("link", { name: "Vaata pakkumist" }),
  ).toBeVisible();
  await page.route("**/data/lunch.json", (r) =>
    r.fulfill({ status: 503, body: "Failed" }),
  );
  await page.reload();
  await expect(
    page
      .locator(".offers-card")
      .getByText("Päevapakkumine pole hetkel saadaval", { exact: true }),
  ).toBeVisible();
});
test("Displayed menu expires at Tallinn midnight without a refresh", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-10-08T20:59:55Z"));
  await page.route("**/data/lunch.json", (r) => r.fulfill({ json: menu }));
  await page.goto("./");
  await expect(page.locator(".offer-items")).toBeVisible();
  // Switch the mocked current time and let App's ordinary 15-second tick run.
  await page.clock.setFixedTime(new Date("2026-10-08T21:00:10Z"));
  await page.clock.runFor(15000);
  await expect(
    page
      .locator(".offers-card")
      .getByText("Tänast päevapakkumist pole veel avaldatud.", { exact: true }),
  ).toBeVisible();
});
