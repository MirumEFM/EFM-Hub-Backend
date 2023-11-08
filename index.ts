import express from "express";
import cors from "cors";

import { startBrowser } from "./src/libs/puppeteer";

import merchant from "./src/services/merchant";

import { subAccountController, rankingController, contestController } from "./src/controllers";
import Task, { getTask } from "./src/utils/task";

const port = process.env.PORT || 8080;

const app = express();
app.use(express.json());
app.use(cors());

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/status/:taskId", (req, res) => {
  const { taskId } = req.params;
  if (!taskId) return res.status(400).json({ error: "Missing params" });
  try {
    const task = getTask(taskId);
    res.status(200).send(task.status);
  } catch (err: any) {
    res.status(400).send({
      error: err.message,
    });
  }
});

// recebe body com accountId e credenciais e retorna sub contas dessa conta
app.post("/subaccounts", async (req, res) => {
  const { accountId, credentials } = req.body;
  if (!accountId) return res.status(400).json({ error: "Missing params" });
  if (!credentials.email || !credentials.password) return res.status(403).json({ error: "Missing credentials" });

  const task = new Task("Procurando sub contas");

  try {
    const { browser, page } = await startBrowser(false);
    // Logs into Google Merchant Center
    merchant.login(page, credentials, task).then(() => {
      // Gets sub accounts from the given account
      subAccountController({ accountId }, page, task).then(() => {
        browser.close();
      });
    });
  } catch (err: any) {
    task.update({
      status: "error",
      message: err.message,
      progress: 100,
    });
  }
  res.status(200).send({ taskId: task.id });
});

// Receives an "issues" object and contest all of them in the Google Merchant Center
app.post("/contest", async (req, res) => {
  const { issues, credentials } = req.body as {
    issues?: { issue: IssueType; subAccountId: string; sku: string }[];
    credentials: { email: string; password: string } | undefined;
  };

  if (!issues) {
    return res.status(400).json({ error: "Missing params" });
  }
  if (!credentials || !credentials.email || !credentials.password) {
    return res.status(403).json({ error: "Missing credentials" });
  }

  try {
    const { browser, page } = await startBrowser();
    console.log(issues);

    const task = new Task("Contestando produtos");

    merchant.login(page, credentials, task).then(() => {
      contestController(issues, page, task).then(() => {
        browser.close();
      });
    });

    res.status(200).send({ taskId: task.id });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Erro interno no servidor",
    });
  }
});

function checkProducts(products: any) {
  if (!products) throw new Error("Missing products");
  if (!Array.isArray(products)) throw new Error("Products must be an array");
  if (!products.every(p => p.name && p.store)) throw new Error("Products must have name and store");
  return true;
}

app.post("/ranking", async (req, res) => {
  try {
    const { products } = req.body;
    checkProducts(products); // Throws error when invalid objects are found

    const { browser, page } = await startBrowser();

    const task = new Task("Iniciando busca...");

    rankingController(products, page, task).then(() => {
      browser.close();
    });

    res.status(200).json({ taskId: task.id });
  } catch (err: any) {
    console.log(err.message);
    res.status(400).json({ error: err.message });
  }
});
