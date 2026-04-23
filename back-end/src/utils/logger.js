import pino from "pino";
import { env } from "../config/env.js";
import { SERVICE_NAME } from "../config/constants.js";

const isDev = env.NODE_ENV === "development";

export const logger = pino({
  name: SERVICE_NAME,
  level: isDev ? "debug" : "info",
  base: { service: SERVICE_NAME, env: env.NODE_ENV },
  transport: isDev
    ? {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "SYS:standard" },
      }
    : undefined,
});
