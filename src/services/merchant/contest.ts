import { Page } from "puppeteer";

export async function contest(page: Page, issue: IssueType): Promise<void> {
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
  