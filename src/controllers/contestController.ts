import { updateTaskStatus } from "../utils/statusManager";
import { Page } from "puppeteer";

async function contest(issue: Issue) {}

export async function contestController(
  data: {
    subAccounts: Issue[];
  },
  page: Page,
  taskId: string
) {
  updateTaskStatus(taskId, {
    message: "Iniciando contestação de produtos",
  });

  for (const issue of data.subAccounts) {
    const currentIndex = data.subAccounts.indexOf(issue);
    updateTaskStatus(taskId, {
      message: `Contestando produto ${currentIndex}/${data.subAccounts.length}`,
      progress: (currentIndex / data.subAccounts.length) * 100,
    });
    await page.goto(issue.url);
    await contest(issue);
  }

  updateTaskStatus(taskId, {
    message: "Contestação finalizada",
  });
}
