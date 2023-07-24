import { executablePath } from "puppeteer";
import puppeteer from "puppeteer-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";

export async function startBrowser(headless?: boolean | "new") {
  puppeteer.use(stealthPlugin());
  const browser = await puppeteer.launch({
    headless: headless || false,
    executablePath: executablePath(),
  });
  const [page] = await browser.pages();
  return { browser, page };
}
