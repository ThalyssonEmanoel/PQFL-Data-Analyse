import pinoHttp from "pino-http";
import { logger } from "../utils/logger.js";

export const httpLogger = pinoHttp({
  logger,
  customProps: (req) => ({ requestId: req.id }),
  customLogLevel(_req, res, err) {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
      };
    },
  },
});
