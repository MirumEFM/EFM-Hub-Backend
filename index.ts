import express from "express";
import cors from "cors";

import { randomUUID } from "crypto";
import { startBrowser } from "./src/libs/puppeteer";

import {
  loginController,
  subAccountController,
  rankingController,
} from "./src/controllers";
import {
  createTaskStatus,
  getTaskStatus,
  updateTaskStatus,
} from "./src/utils/statusManager";

// @TODO: FIX startBrowser

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

app.get("/status/:taskId", async (req, res) => {
  const { taskId } = req.params;
  if (!taskId) return res.status(400).json({ error: "Missing params" });
  try {
    const taskStatus = await getTaskStatus(taskId);
    res.status(200).send(taskStatus);
  } catch (err: any) {
    res.status(400).send({
      error: err.message,
    });
  }
});

// recebe body com accountId e credenciais e retorna subcontas dessa conta
app.post("/subaccounts", async (req, res) => {
  const { accountId, credentials } = req.body;
  if (!accountId) return res.status(400).json({ error: "Missing params" });
  if (!credentials.email || !credentials.password)
    return res.status(403).json({ error: "Missing credentials" });

  const { browser, page } = await startBrowser(false);

  const taskId = randomUUID();
  createTaskStatus(taskId, "Procurando subcontas");

  loginController(credentials, page, taskId)
    .then(() => {
      subAccountController({ accountId }, page, taskId).then(() => {
        browser.close();
      });
    })
    .catch((err) => {
      updateTaskStatus(taskId, {
        status: "error",
        message: err.message,
        progress: 100,
      });
    });
  res.status(200).send({ taskId });
});

app.post("/contest", async (req, res) => {});

function isValidProducts(products: any) {
  if (!products) throw new Error("Missing products");
  if (!Array.isArray(products)) throw new Error("Products must be an array");
  if (!products.every((p) => p.name && p.store))
    throw new Error("Products must have name and store");
  return true;
}

app.post("/ranking", async (req, res) => {
  try {
    const { products } = req.body;
    const { browser, page } = await startBrowser();
    const taskId = randomUUID();

    createTaskStatus(taskId, "Iniciando busca...");

    rankingController(products, page, taskId).then(() => {
      browser.close();
    });

    res.status(200).json({ taskId });
  } catch (err: any) {
    console.log(err.message);
    res.status(400).json({ error: err.message });
  }
});
