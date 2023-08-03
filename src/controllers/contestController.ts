import { updateTaskStatus } from "../utils/statusManager";
import { Page } from "puppeteer";

export async function contestController(
  data: {
    issue: IssueType;
    subAccountId: string;
    sku: string;
  }[],
  page: Page,
  taskId: string
) {
  updateTaskStatus(taskId, {
    message: "Iniciando contestação de produtos",
  });

  for (const item of data) {
    const currentIndex = data.indexOf(item);
    updateTaskStatus(taskId, {
      message: `Contestando item ${currentIndex}/${data.length}`,
      progress: (currentIndex / data.length) * 100,
    });
    const url = getItemURL(item.subAccountId, item.sku);

    await page.goto(url);
    try {
      await contest(page, item.issue);
    } catch (err) {
      console.log(err);
      console.log(item);
    }
  }

  updateTaskStatus(taskId, {
    message: "Contestação finalizada",
  });
}

function getItemURL(subAccountId: string, sku: string) {
  return `https://merchants.google.com/mc/items/details?a=${subAccountId}&offerId=${sku}&language=pt&channel=0&feedLabel=BR&hl=pt`;
}

async function contest(page: Page, issue: IssueType): Promise<void> {
  // Primeiro botão "Pedir análise"
  await page.waitForSelector(".mcn-button-touch-target", {
    timeout: 5000,
  });

  await page.evaluate(async () => {
    const button = document.querySelector(
      ".mcn-button-touch-target"
    ) as HTMLElement;
    button.click();
  });

  // Caso seja popup de múltipla escolha
  if (issue === "Documentos falsificados") {
    await page.evaluate(async () => {
      const options = Array.from(
        document.querySelector("material-radio-group")
          ?.children as HTMLCollection
      );
      const btn = options.find((el) =>
        el.textContent?.includes("Meu produto cumpre os requisitos da política")
      ) as HTMLElement;
      btn?.click();
    });
  }

  // Segundo botão "Pedir análise" (confirmação)
  await page.evaluate(() => {
    const popupButtons = document
      .querySelector("material-dialog")
      ?.querySelectorAll("span") as NodeListOf<HTMLSpanElement>;
    const btn = Array.from(popupButtons).find((btn) =>
      btn.textContent?.includes("Pedir análise")
    );
    btn?.click();
  });
}
