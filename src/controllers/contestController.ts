import { Page } from "puppeteer";
import { getSubAccounts } from "../contest";
import { createTaskStatus, updateTaskStatus } from "../tools/statusManager";

export async function contestController(
  data: { accountId: string },
  page: Page,
  taskId: string
) {
  const { accountId } = data;
  try {
    updateTaskStatus(taskId, {
      message: "Procurando subcontas",
      progress: 0,
    });
    const subAccounts = await getSubAccounts(page, accountId);

    const urls = subAccounts.map((subAccount) => {
      return {
        url: `https://merchants.google.com/mc/products/diagnostics?a=${subAccount.id}&tab=item_issues`,
        issue: subAccount.issue,
      };
    });

    updateTaskStatus(taskId, {
      message: "Esperando por CSV",
      progress: 70,
      data: urls,
    });
  } catch (err) {
    console.log("Error contesting products:", err);
  }
}
