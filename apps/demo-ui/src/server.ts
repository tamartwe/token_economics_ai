import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import { runRoutingDemo, runSendLessDemo } from "./demoApi.js";

const port = Number(process.env.PORT ?? 5173);
const isProduction = process.env.NODE_ENV === "production";
const appRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const app = express();

app.use(express.json());

app.get("/api/send-less", async (_request, response, next) => {
  try {
    response.json(await runSendLessDemo());
  } catch (error) {
    next(error);
  }
});

app.post("/api/send-less", async (request, response, next) => {
  try {
    const body = request.body as { question?: unknown };
    const question =
      typeof body.question === "string" ? body.question.trim() : "";

    if (!question) {
      response.status(400).json({ error: "Question must not be empty." });
      return;
    }

    response.json(await runSendLessDemo(question));
  } catch (error) {
    next(error);
  }
});

app.get("/api/routing", async (_request, response, next) => {
  try {
    response.json(await runRoutingDemo());
  } catch (error) {
    next(error);
  }
});

if (isProduction) {
  app.use(express.static(path.join(appRoot, "dist")));
  app.get("*", (_request, response) => {
    response.sendFile(path.join(appRoot, "dist", "index.html"));
  });
} else {
  const vite = await createViteServer({
    root: appRoot,
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

app.use(
  (
    error: unknown,
    _request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    if (response.headersSent) {
      next(error);
      return;
    }

    const message = error instanceof Error ? error.message : String(error);
    response.status(500).json({ error: message });
  },
);

app.listen(port, "127.0.0.1", () => {
  console.log(`Demo UI running at http://127.0.0.1:${port}/`);
});
