import { Page } from "puppeteer";

// All valid "Next" button texts
const validNext: string[] = [
  "Próxima", // PT-BR
  "Avançar", // PT-BR
  "Continuar", // PT-BR
  "Seguinte", // PT-PT
  "Next", // EN-US / EN-GB
  "Siguiente", // ES-ES / ES-LA
];

// Log in to Google Merchant
function logIn(
  page: Page,
  credentials: { email: string; password: string }
): Promise<void> {
  return new Promise(async (resolve) => {
    console.log("Logging in");
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

function getSubAccountIssuesURL(): string {
  return Array.from(document.querySelectorAll("issue-label"))
    .map((el, i) => {
      try {
        const anchor = el.parentNode?.parentNode?.parentNode?.children[1]
          .children[0].children[1] as HTMLAnchorElement;
        return {
          nome: el.children[0]?.children[1].textContent?.split("\n")[0],
          url: anchor.href,
        };
      } catch (err) {}
    })
    .filter((v) => v)
    .find((el) => el?.nome?.includes("Violação das políticas do Google"))
    ?.url as string;
}

type SubAccountType = {
  nome: string;
  id: string;
};

/* Returns an array of subAccounts of given account */
async function getSubAccounts(
  page: Page,
  accountId: string
): Promise<SubAccountType[]> {
  // Go to Merchant item issues page
  await page.goto(
    `https://merchants.google.com/mc/mcadiagnostics?a=${accountId}&tab=item_issues`
  );
  await page.waitForNetworkIdle();
  await page.evaluate(async () => {
    document.querySelectorAll<HTMLElement>("span.predicate-text")[2].click();

    await new Promise((resolve) => setTimeout(resolve, 1000));

    document.querySelectorAll<HTMLElement>("material-select-item")[4].click();
  });
  await page.waitForNetworkIdle();

  const url = await page.evaluate(getSubAccountIssuesURL);
  await page.goto(url);
  await page.waitForSelector(
    "a[activityname='ClickMcaItemIssueSubAccountName']"
  );

  const subAccounts = await page.evaluate(() => {
    return Array.from(
      document.querySelectorAll(
        "a[activityname='ClickMcaItemIssueSubAccountName']"
      )
    ).map((i) => {
      return {
        nome: i.textContent as string,
        id: i.getAttribute("href")?.split("=")[1].split("&")[0] as string,
      };
    });
  });

  return subAccounts;
}

/** Returns list of flagged products */
async function getIssues(
  page: Page,
  subAccounts: SubAccountType[]
): Promise<string[]> {
  const subAccount = subAccounts[0];
  await page.goto(
    `https://merchants.google.com/mc/products/diagnostics?a=${subAccount.id}&tab=item_issues`
  );

  return [""];
}

export { logIn, getSubAccounts, getIssues };
