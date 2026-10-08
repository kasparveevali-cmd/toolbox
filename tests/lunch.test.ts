import { test } from "node:test";
import assert from "node:assert/strict";
import type { LunchData } from "../src/types";
import { lunchState, isLunchMorning } from "../src/utils/lunch";
import { parseLunch, fetchLunch } from "../scripts/providers/lunch";
import { lunchSource } from "../src/config/lunch";
const today: LunchData = {
  checkedAt: "2026-10-08T07:00:00Z",
  offerDate: "2026-10-08",
  status: "available",
  items: [{ name: "Testiroog", price: "6,50 €" }],
};
test("Lunch never labels a yesterday, future, undated, or empty offer as today's", () => {
  const now = new Date("2026-10-08T07:15:00Z");
  assert.equal(lunchState(today, now), "available");
  for (const offerDate of [null, "2026-10-07", "2026-10-09"])
    assert.equal(lunchState({ ...today, offerDate }, now), "unpublished");
  assert.equal(lunchState({ ...today, items: [] }, now), "unpublished");
  assert.equal(lunchState({ ...today, status: "error" }, now), "error");
  // 00:15 in Tallinn is already the next day even though UTC remains October 8.
  assert.equal(
    lunchState(today, new Date("2026-10-08T21:15:00Z")),
    "unpublished",
  );
});
test("Morning refresh gate uses Tallinn weekdays and DST, not the runner timezone", () => {
  for (const time of [
    "2026-10-08T05:00:00Z",
    "2026-10-08T08:30:00Z",
    "2026-12-08T06:00:00Z",
    "2026-12-08T09:30:00Z",
  ])
    assert.equal(isLunchMorning(new Date(time)), true, time);
  for (const time of [
    "2026-10-08T04:30:00Z",
    "2026-10-08T09:00:00Z",
    "2026-10-10T06:00:00Z",
    "2026-12-08T05:30:00Z",
    "2026-12-08T10:00:00Z",
  ])
    assert.equal(isLunchMorning(new Date(time)), false, time);
});
function source(date = "2026-10-08T00:00:00+03:00", price = "5,90 €") {
  const stamp = Date.parse(date) / 1000;
  // Mirrors the inspected restaurant modal; unrelated list cards are deliberately present.
  return `<div class="diner"><div class="modal_food_modal">Teise restorani toit</div></div><div id="restaurant_modal"><h1 class="modal-resto">Lido Bistro Ülemiste</h1><a class="modal_share" href="${lunchSource}"></a><ul class="menu_tab"><li id="menu_${stamp}">Täna</li></ul><div class="menu_menu menu_${stamp}"><h2>Tänased lõunapakkumised</h2><div class="row single"><div class="modal_price_modal">${price}</div><div class="modal_food_modal"><span>Testiroog &amp; salat</span></div></div></div></div>`;
}
test("Parser selects only Lido's date-stamped panel and preserves missing prices", () => {
  const now = new Date("2026-10-08T07:00:00Z");
  const data = parseLunch(source(), now);
  assert.equal(data.offerDate, "2026-10-08");
  assert.deepEqual(data.items, [
    { name: "Testiroog & salat", price: "5,90 €" },
  ]);
  assert.equal(parseLunch(source(undefined, ""), now).items[0].price, null);
  assert.equal(
    parseLunch(
      source("2026-12-08T00:00:00+02:00"),
      new Date("2026-12-08T07:00:00Z"),
    ).status,
    "available",
  );
});
test("Source's 'today' label alone never establishes the offer date", () => {
  const now = new Date("2026-10-08T07:00:00Z");
  for (const date of [
    "2026-10-07T00:00:00+03:00",
    "2026-10-09T00:00:00+03:00",
    "2026-10-08T01:00:00+03:00",
  ])
    assert.equal(parseLunch(source(date), now).status, "unpublished");
  assert.equal(
    parseLunch(source().replaceAll(/menu_\d+/g, "menu_unknown"), now).status,
    "unpublished",
  );
  assert.equal(
    parseLunch(source().replace("<span>Testiroog &amp; salat</span>", ""), now)
      .status,
    "unpublished",
  );
  assert.throws(
    () => parseLunch("<html>Access denied</html>", now),
    /struktuuri/,
  );
});
test("Provider errors are not interpreted as an unpublished or valid menu", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response("Blocked", { status: 403 });
    await assert.rejects(fetchLunch(), /HTTP 403/);
  } finally {
    globalThis.fetch = original;
  }
});
