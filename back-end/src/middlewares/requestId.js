import { randomUUID } from "node:crypto";

const HEADER = "x-request-id";

export function requestId(req, res, next) {
  const incoming = req.headers[HEADER];
  const id = typeof incoming === "string" && incoming.length > 0 ? incoming : randomUUID();
  req.id = id;
  res.setHeader(HEADER, id);
  next();
}
