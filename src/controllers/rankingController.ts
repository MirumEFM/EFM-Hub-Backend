import { Page } from "puppeteer";
import userAgent from "user-agents";
import { createTaskStatus, updateTaskStatus } from "../tools/statusManager";

export async function rankingController(
  data: ProductType[],
  page: Page,
  taskId: string
) {
  const productsResult: Result[] = [];
  createTaskStatus(taskId, "Iniciando busca...");
  try {
    for (const product of data) {
      let agent = new userAgent().random().toString();
      const agentVersion = parseInt(
        agent.split(" ").splice(-2)[0].split("/")[1].split(".")[0]
      );
      while (
        agent.includes("Android") ||
        agent.includes("iPhone") ||
        agent.includes("iPad") ||
        agentVersion < 114
      ) {
        agent = new userAgent().random().toString();
      }

      console.log(agent);
      await page.setUserAgent(agent);
      await page.goto(
        `https://www.google.com/search?q=${encodeURI(product.name)}&tbm=shop`
      );
      let result = null;
      await page.waitForSelector("div.sh-sr__shop-result-group", {
        timeout: 30000,
      });

      const resultGroup = await page.evaluate(() => {
        return Array.from(
          document.querySelectorAll<HTMLDivElement>(
            "div.sh-sr__shop-result-group.Qlx7of"
          )
        );
      });

      if (resultGroup.length > 1) {
        result = {
          name: product.name,
          store: product.store,
          position: 1,
        };
      } else {
        const products = await page.evaluate(() => {
          return Array.from(
            document.querySelector<HTMLDivElement>(
              "div.sh-pr__product-results-grid.sh-pr__product-results"
            )?.children!
          )
            .filter((el) => el.tagName == "DIV")
            .map((p, index) => {
              return {
                name: p.querySelector("h3")?.innerText.replaceAll("–", "-")!,
                position: index + 1,
                store: Array.from(p.querySelectorAll("a"))
                  .filter((anchor) => anchor.innerText)
                  .map((el) => el.innerText.split("\n")[2])[1],
              };
            });
        });

        result = products.find(
          (p) =>
            p.name.includes(product.name) && p.store.includes(product.store)
        );
      }

      if (result) {
        productsResult.push({
          name: product.name,
          postition: result.position,
        });
      } else {
        productsResult.push({ name: product.name, postition: -1 });
      }

      updateTaskStatus(taskId, {
        progress: (productsResult.length / data.length) * 100,
        message: `${productsResult.length}/${data.length} produtos encontrados`,
        data: productsResult,
      });
    }
    updateTaskStatus(taskId, {
      status: "finished",
      message: `Busca finalizada`,
      progress: 100,
      data: productsResult,
    });
  } catch (err) {
    console.log(err);
    updateTaskStatus(taskId, {
      status: "error",
      message: `Erro ao buscar posição de ${data[0].name}`,
      progress: 100,
      data: productsResult,
    });
  }
}
