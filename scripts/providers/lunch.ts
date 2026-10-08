import { load } from "cheerio";
import { lunchSource } from "../../src/config/lunch";
import { dateKey, clock } from "../../src/utils/time";
import type { LunchData } from "../../src/types";
import { fetchPublic } from "../io";
const clean = (value: string) =>
  value
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .replace(/\s+/g, " ")
    .trim();
export function parseLunch(html: string, now = new Date()): LunchData {
  const $ = load(html);
  const modal = $("#restaurant_modal");
  // The response also contains unrelated restaurants. Only this source's own modal is eligible.
  if (
    modal.length !== 1 ||
    !/^Lido\b/i.test(clean(modal.find(".modal-resto").text())) ||
    modal.find("a.modal_share").attr("href") !== lunchSource
  )
    throw new Error("Lido allikalehe struktuuri ei õnnestunud kinnitada");
  const empty: LunchData = {
    checkedAt: now.toISOString(),
    offerDate: null,
    status: "unpublished",
    items: [],
  };
  const today = dateKey(now);
  const panels = modal.find(".menu_menu").filter((_, panel) => {
    const id = ($(panel).attr("class") ?? "")
      .split(/\s+/)
      .find((c) => /^menu_\d{10}$/.test(c));
    if (!id || modal.find(`.menu_tab li[id="${id}"]`).length !== 1)
      return false;
    const date = new Date(Number(id.slice(5)) * 1000);
    // Observed source ids encode the offer date at midnight in Europe/Tallinn.
    return dateKey(date) === today && clock(date) === "00:00";
  });
  if (!panels.length) return empty;
  if (panels.length !== 1)
    throw new Error("Pakkumise kuupäev on mitmetähenduslik");
  const items: LunchData["items"] = [];
  panels
    .first()
    .find(".row")
    .each((_, row) => {
      const name = clean($(row).find(".modal_food_modal").text());
      const price = clean($(row).find(".modal_price_modal").text()) || null;
      if (name) items.push({ name, price });
    });
  if (items.some((i) => i.name.length > 1000) || items.length > 30)
    throw new Error("Pakkumise formaat muutus");
  return items.length
    ? { ...empty, offerDate: today, status: "available", items }
    : empty;
}
export async function fetchLunch(now = new Date()): Promise<LunchData> {
  const response = await fetchPublic(lunchSource);
  if (
    response.url !== lunchSource ||
    !response.headers.get("content-type")?.includes("text/html")
  )
    throw new Error("Allikas ei tagastanud oodatud lehte");
  const html = await response.text();
  if (html.length > 5 * 1024 * 1024)
    throw new Error("Allikaleht ületab suuruse piiri");
  return parseLunch(html, now);
}
