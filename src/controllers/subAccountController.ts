// !Important This is a temporary replacement and should be removed once the oldSubAccountController is working again

import { Page } from "puppeteer";
import Task from "../utils/task";

/**
This function currently only works for accounts that don't have sub accounts
@description Temporary replacement for the old subAccountController which is now found in src/controllers/oldSubAccountController.ts
*/
export async function subAccountController(data: { accountId: string }, page: Page, task: Task) {
  const { accountId } = data;
  try {
    task.update({ message: "Procurando subcontas...", progress: 40 });

    const urls = {
      url: `https://merchants.google.com/mc/products/diagnostics?a=${accountId}&tab=item_issues`,
      issue: "placeholder",
    };

    task.update({ status: "finished", message: "Esperando por CSV", progress: 100, data: urls });
  } catch (err) {
    console.log("Error contesting products:", err);
  }
}

function getIssues() {}
