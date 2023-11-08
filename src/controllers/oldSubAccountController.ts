import { Page } from "puppeteer";
import Task from "../utils/task";

/** @deprecated Google seems to have changed some things about these pages */
export async function subAccountController(data: { accountId: string }, page: Page, task: Task) {
  const { accountId } = data;
  try {
    task.update({ message: "Procurando subcontas...", progress: 40 });

    const subAccounts = await getSubAccounts(page, accountId, task);

    const urls = subAccounts.map(subAccount => {
      return {
        url: `https://merchants.google.com/mc/products/diagnostics?a=${subAccount.id}&tab=item_issues`,
        issue: subAccount.issue,
      };
    });

    task.update({ status: "finished", message: "Esperando por CSV", progress: 100, data: urls });
  } catch (err) {
    console.log("Error contesting products:", err);
  }
}

type SubAccountType = {
  name: string;
  id: string;
  issue: string;
};

/* Returns an array of subAccounts of given account */
async function getSubAccounts(page: Page, accountId: string, task: Task): Promise<SubAccountType[]> {
  // Go to Merchant item issues page

  task.update({
    message: "Carregando página de problemas",
  });

  /* 
  New URL:
    https://merchants.google.com/mc/products/diagnostics?a=${accountId}&tab=item_issues
  This url below seems to be an old version of the page, and it doesn't work anymore
    https://merchants.google.com/mc/mcadiagnostics?a=${accountId}&tab=item_issues
  */

  // Navigates to item issues page
  await page.goto(`https://merchants.google.com/mc/mcadiagnostics?a=${accountId}&tab=item_issues`);
  await page.waitForNetworkIdle();

  // Filters by free listings
  await page.evaluate(async () => {
    document.querySelectorAll<HTMLElement>("span.predicate-text")[2].click(); // Abre opções
    await new Promise(resolve => setTimeout(resolve, 500)); // Espera por 500ms
    document.querySelectorAll<HTMLElement>("material-select-item")[4].click(); // Seleciona Listagens gratuitas
  });

  // Waits for page to load
  await page.waitForNetworkIdle();

  // Updates task status
  task.update({
    message: "Buscando sub contas com problemas",
  });

  // Gets all sub accounts with issues
  const subAccountIssues = await page.evaluate(getSubAccountIssuesURL);

  // Handle no sub accounts

  const subAccounts: SubAccountType[][] = [];
  for (const subAccountIssue of subAccountIssues) {
    const currentIndex = subAccountIssues.indexOf(subAccountIssue);
    task.update({
      message: `Sub conta ${currentIndex}/${subAccountIssues.length}`,
      progress: (currentIndex / subAccountIssues.length) * 100,
    });

    page.goto(subAccountIssue.url);
    await page.waitForSelector("a[activityname='ClickMcaItemIssueSubAccountName']");

    let items: SubAccountType[] = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a[activityname='ClickMcaItemIssueSubAccountName']")).map(i => {
        return {
          name: i.textContent as string,
          id: i.getAttribute("href")?.split("=")[1].split("&")[0] as string,
          issue: "",
        };
      });
    });

    items.forEach(i => {
      i.issue = subAccountIssue.type;
    });

    subAccounts.push(items);
  }

  return subAccounts.flatMap(el => el);
}

function getSubAccountIssuesURL(): { url: string; type: string }[] {
  const issues: IssueType[] = ["Medicamentos controlados e vendidos sem receita", "Produtos farmacêuticos e suplementos proibidos", "Documentos falsificados"];

  return Array.from(document.querySelectorAll("issue-label"))
    .map((el, i) => {
      try {
        // Gets issue examples url from "Ver exemplos" link
        const anchor = el.parentNode?.parentNode?.parentNode?.children[1].children[0].children[1] as HTMLAnchorElement;
        return {
          nome: el.children[0]?.children[1]?.textContent?.split("\n")[0].replace("help_outline", ""),
          url: anchor.href,
          type: "",
        };
      } catch (err) {}
    })
    .filter(v => v) // Removes all falsy values
    .filter(v => {
      // Adiciona tipo do issue às sub contas
      let res = [];
      for (const issue of issues) {
        if (v?.nome?.includes(issue)) {
          res.push(true);
          v.type = issue;
        }
      }
      return res.includes(true);
    })
    .map(el => {
      return { url: el?.url, type: el?.type };
    }) as { url: string; type: string }[];
}
