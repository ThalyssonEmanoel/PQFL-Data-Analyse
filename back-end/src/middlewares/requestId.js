import { randomUUID } from "node:crypto";

// Atribui um correlation id (req.id) por requisicao, propagado em logs e respostas
// (secao 10.1). Respeita um X-Request-Id recebido (util atras de proxy/gateway).
const requestId = (req, res, next) => {
  const incoming = req.headers["x-request-id"];
  req.id = typeof incoming === "string" && incoming.trim() ? incoming.trim() : randomUUID();
  res.setHeader("X-Request-Id", req.id);
  next();
};

export default requestId;
