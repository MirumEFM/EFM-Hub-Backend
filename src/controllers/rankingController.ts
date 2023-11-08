import { Page } from "puppeteer";
import UserAgent from "user-agents";
import Task from "../utils/task";

export async function rankingController(data: ProductType[], page: Page, task: Task) {
  let currentIndex = 0;
  const productsResult: Result[] = [];
  try {
    for (const product of data) {
      // Criando apenas user-agents desktop no Windows por consistência da interface.
      let userAgent = new UserAgent({
        deviceCategory: "desktop",
        platform: "Win32",
      }).toString();

      await page.setUserAgent(userAgent);
      await page.goto(`https://www.google.com/search?q=${encodeURI(product.name)}&tbm=shop`);
      let result = null;
      await page.waitForSelector("div.sh-sr__shop-result-group", {
        timeout: 30000,
      });

      const resultGroup = await page.evaluate(() => {
        return Array.from(document.querySelectorAll<HTMLDivElement>("div.sh-sr__shop-result-group.Qlx7of"));
      });

      if (resultGroup.length > 1) {
        result = {
          name: product.name,
          store: product.store,
          position: 1,
        };
      } else {
        const products = await page.evaluate(() => {
          return Array.from(document.querySelector<HTMLDivElement>("div.sh-pr__product-results-grid.sh-pr__product-results")?.children!)
            .filter(el => el.tagName == "DIV")
            .map((p, index) => {
              return {
                name: p.querySelector("h3")?.innerText.replaceAll("–", "-")!,
                position: index + 1,
                store: Array.from(p.querySelectorAll("a"))
                  .filter(anchor => anchor.innerText)
                  .map(el => el.innerText.split("\n")[2])[1],
              };
            });
        });
        result = products.find(p => {
          return p.name.trim().includes(product.name.trim()) && p.store.trim().includes(product.store.trim());
        });
      }

      if (result) {
        productsResult.push({
          name: product.name,
          position: result.position,
        });
      } else {
        productsResult.push({ name: product.name, position: -1 });
      }

      task.update({
        progress: (currentIndex / data.length) * 100,
        message: `${productsResult.length}/${data.length} produtos encontrados`,
        data: productsResult,
      });
      currentIndex++;
    }

    task.update({
      status: "finished",
      message: `Busca finalizada`,
      progress: 100,
      data: productsResult,
    });
  } catch (err) {
    console.log(err);
    task.update({
      status: "error",
      message: `Erro ao buscar posição de ${data[currentIndex].name}`,
      progress: 100,
      data: productsResult,
    });
  }
}
