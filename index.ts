import express from "express";

import { randomUUID } from "crypto";
import { startBrowser } from "./src/libs/puppeteer";

import {
  loginController,
  contestController,
  rankingController,
} from "./src/controllers";
import { getTaskStatus } from "./src/tools/statusManager";

const port = process.env.PORT || 8080;

const app = express();
app.use(express.json());

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

app.post("/contest", async (req, res) => {
  const { accountId, credentials } = req.body;
  if (!accountId) return res.status(400).json({ error: "Missing params" });
  if (!credentials.email || !credentials.password)
    return res.status(403).json({ error: "Missing credentials" });
  const { browser, page } = await startBrowser(false);
  const taskId = randomUUID();

  loginController(credentials, page, taskId).then(() => {
    contestController({ accountId }, page, taskId).then(() => {
      browser.close();
    });
  });
  res.status(200).send({ taskId });
});

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
    isValidProducts(products);

    const { browser, page } = await startBrowser();
    const taskId = randomUUID();

    rankingController(products, page, taskId).then(() => {
      browser.close();
    });

    res.status(200).json({ taskId });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});