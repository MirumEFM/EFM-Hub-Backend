import { Page } from "puppeteer";
import { logIn } from "../contest";
import { createTaskStatus, updateTaskStatus } from "../tools/statusManager";

export async function loginController(
  data: LoginData,
  page: Page,
  taskId: string
) {
  const { email, password } = data;
  updateTaskStatus(taskId, {
    message: "Iniciando login...",
  });
  await logIn(page, { email, password });

  updateTaskStatus(taskId, {
    status: "pending",
    message: `Esperando 2FA`,
    progress: 25,
    data: null,
  });

  // wait for user to accept 2FA (wait for page to change url) [wait for networkidle0? ]
  await page.waitForNavigation();
  await page.waitForNavigation();
  await page.waitForNavigation();
  if (page.url().includes("https://accounts.google.com/speedbump/")) {
    // wait for selector of span with text "Continuar" to load and click it
    await page.evaluate(() => {
      const buttons = document.querySelectorAll("span");
      for (const button of buttons) {
        if (button.textContent === "Continuar") {
          button.click();
          break;
        }
      }
    });
  }

  updateTaskStatus("login", {
    status: "finished",
    message: `Login finalizado!`,
    progress: 100,
  });

  await page.waitForNavigation();
}
