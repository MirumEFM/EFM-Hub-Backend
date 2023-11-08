import merchant from "../services/merchant";
import Task from "../utils/task";
import { Page } from "puppeteer";

type DataType = {
  issue: IssueType;
  subAccountId: string;
  sku: string;
}[];

export async function contestController(data: DataType, page: Page, task: Task) {
  task.update({ message: "Iniciando contestação de produtos" });
  for (const item of data) {
    const currentIndex = data.indexOf(item);

    task.update({
      message: `Contestando item ${currentIndex}/${data.length}`,
      progress: (currentIndex / data.length) * 100,
    });
    const url = getItemURL(item.subAccountId, item.sku);

    await page.goto(url);
    try {
      await merchant.contest(page, item.issue);
    } catch (err) {
      console.log(err);
      console.log(item);
    }
  }
  task.update({
    message: "Contestação finalizada",
    progress: 100,
  });
}

function getItemURL(subAccountId: string, sku: string) {
  return `https://merchants.google.com/mc/items/details?a=${subAccountId}&offerId=${sku}&language=pt&channel=0&feedLabel=BR&hl=pt`;
}
