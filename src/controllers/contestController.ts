import { Page } from "puppeteer";
import { getIssues, getSubAccounts } from "../contest";
import { createTaskStatus, updateTaskStatus } from "../tools/statusManager";

export async function contestController(
  data: { accountId: string },
  page: Page,
  taskId: string
) {
  const { accountId } = data;
  try {
    const subAccounts = await getSubAccounts(page, accountId);
    const urls = subAccounts.map(
      (subAccount) =>
        `https://merchants.google.com/mc/products/diagnostics?a=${subAccount.id}&tab=item_issues`
    );

    updateTaskStatus(taskId, {
      status: "pending",
      message: "Esperando por CSV",
      progress: 100,
      data: urls,
    });
  } catch (err) {
    console.log("Error contesting products:", err);
  }
}
