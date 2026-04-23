import express from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "./config/env.js";
import { requestId } from "./middlewares/requestId.js";
import { httpLogger } from "./middlewares/httpLogger.js";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import apiRouter from "./routes/index.js";
import { mountSwagger } from "./docs/index.js";

export function createApp() {
  const app = express();

  if (env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }
  app.disable("x-powered-by");

  // 1. Request id
  app.use(requestId);

  // 2. Security
  app.use(helmet());

  // 3. CORS
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: false,
    }),
  );

  // 4. Body parser
  app.use(express.json({ limit: env.JSON_BODY_LIMIT }));

  // 5. Logger
  app.use(httpLogger);

  // 6. Routes
  app.use(env.API_PREFIX, apiRouter);
  mountSwagger(app, { path: "/docs" });

  // 7. Not found
  app.use(notFound);

  // 8. Global error handler
  app.use(errorHandler);

  return app;
}
