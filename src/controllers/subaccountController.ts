import { Page } from "puppeteer";
import { updateTaskStatus } from "../utils/statusManager";

export async function subaccountController(
  data: { accountId: string },
  page: Page,
  taskId: string
) {
  const { accountId } = data;
  try {
    updateTaskStatus(taskId, {
      progress: 40,
      message: "Procurando subcontas...",
    });
    const subAccounts = await getSubAccounts(page, accountId, taskId);

    const urls = subAccounts.map((subAccount) => {
      return {
        url: `https://merchants.google.com/mc/products/diagnostics?a=${subAccount.id}&tab=item_issues`,
        issue: subAccount.issue,
      };
    });

    updateTaskStatus(taskId, {
      status: "finished",
      message: "Esperando por CSV",
      progress: 100,
      data: urls,
    });
  } catch (err) {
    console.log("Error contesting products:", err);
  }
}

function getSubAccountIssuesURL(): { url: string; type: string }[] {
  const issues: IssueType[] = [
    "Medicamentos controlados e vendidos sem receita",
    "Produtos farmacêuticos e suplementos proibidos",
    "Documentos falsificados",
  ];

  return Array.from(document.querySelectorAll("issue-label"))
    .map((el, i) => {
      try {
        const anchor = el.parentNode?.parentNode?.parentNode?.children[1]
          .children[0].children[1] as HTMLAnchorElement;
        return {
          nome: el.children[0]?.children[1]?.textContent
            ?.split("\n")[0]
            .replace("help_outline", ""),
          url: anchor.href,
          type: "",
        };
      } catch (err) {}
    })
    .filter((v) => v) // Remove todos os itens que são null
    .filter((v) => {
      // Adiciona tipo do issue às subcontas
      let res = [];
      for (const issue of issues) {
        if (v?.nome?.includes(issue)) {
          res.push(true);
          v.type = issue;
        }
      }
      return res.includes(true);
    })
    .map((el) => {
      return { url: el?.url, type: el?.type };
    }) as { url: string; type: string }[];
}

type SubAccountType = {
  name: string;
  id: string;
  issue: string;
};

/* Returns an array of subAccounts of given account */
async function getSubAccounts(
  page: Page,
  accountId: string,
  taskId: string
): Promise<SubAccountType[]> {
  // Go to Merchant item issues page

  updateTaskStatus(taskId, {
    message: "Carregando página de problemas",
  });
  await page.goto(
    `https://merchants.google.com/mc/mcadiagnostics?a=${accountId}&tab=item_issues`
  );
  await page.waitForNetworkIdle();

  await page.evaluate(async () => {
    document.querySelectorAll<HTMLElement>("span.predicate-text")[2].click(); // Abre opções
    await new Promise((resolve) => setTimeout(resolve, 500)); // Espera por 500ms
    document.querySelectorAll<HTMLElement>("material-select-item")[4].click(); // Seleciona Listagens gratuitas
  });

  await page.waitForNetworkIdle();

  updateTaskStatus(taskId, {
    message: "Buscando subcontas com problemas",
  });
  const subAccountIssues = await page.evaluate(getSubAccountIssuesURL);

  const subAccounts: SubAccountType[][] = [];
  for (const subAccountIssue of subAccountIssues) {
    const currentIndex = subAccountIssues.indexOf(subAccountIssue);
    updateTaskStatus(taskId, {
      message: `Subconta ${currentIndex}/${subAccountIssues.length}`,
      progress: (currentIndex / subAccountIssues.length) * 100,
    });

    page.goto(subAccountIssue.url);
    await page.waitForSelector(
      "a[activityname='ClickMcaItemIssueSubAccountName']"
    );

    let items: SubAccountType[] = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll(
          "a[activityname='ClickMcaItemIssueSubAccountName']"
        )
      ).map((i) => {
        return {
          name: i.textContent as string,
          id: i.getAttribute("href")?.split("=")[1].split("&")[0] as string,
          issue: "",
        };
      });
    });

    items.forEach((i) => {
      i.issue = subAccountIssue.type;
    });

    subAccounts.push(items);
  }

  return subAccounts.flatMap((el) => el);
}
