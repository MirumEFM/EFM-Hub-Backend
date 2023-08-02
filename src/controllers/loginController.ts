import { Page } from "puppeteer";
import { updateTaskStatus } from "../utils/statusManager";

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
    progress: 35,
    data: null,
  });

  // wait for user to accept 2FA (wait for page to change url)
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

// All valid "Next" button texts
const validNext = [
  "Próxima", // PT-BR
  "Avançar", // PT-BR
  "Continuar", // PT-BR
  "Seguinte", // PT-PT
  "Next", // EN-US / EN-GB
  "Siguiente", // ES-ES / ES-LA
];

// Log in to Google Merchant
export function logIn(
  page: Page,
  credentials: { email: string; password: string }
): Promise<void> {
  return new Promise(async (resolve) => {
    const { email, password } = credentials;
    // Go to Google Merchant login page
    await page.goto("https://accounts.google.com/Login?service=merchants");
    // Find input with type email and insert email
    await page.type('input[type="email"]', email);
    // Find button with any of the validNext texts and click it
    await page.evaluate((validNext) => {
      const buttons = document.querySelectorAll("button");
      for (const button of buttons) {
        if (button.textContent && validNext.includes(button.textContent)) {
          button.click();
          break;
        }
      }
    }, validNext);

    // Wait for OKTA login page to load
    await page.waitForSelector("input[id='input28']");
    // Type in email again
    await page.type("input[id='input28']", email);
    // Click "Next" button
    await page.click("input[type='submit']");
    // Wait for password input to load
    await page.waitForSelector("input[type='password']");
    // Insert password
    await page.type("input[type='password']", password);
    // Click "Next" button again
    await page.click("input[type='submit']");
    // Wait for 2FA page to load
    await page.waitForSelector("h3.authenticator-label");
    // When 2FA page loads, click "Selecionar" Button to select the push notification option
    const buttons = await page.$$("a.button");
    await buttons[1].click();
    resolve();
  });
}
