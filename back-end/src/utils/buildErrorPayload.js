import HttpStatusCodes from "./HttpStatusCodes.js";

// Normaliza erros de validacao, upstream e genericos em um payload HTTP consistente.
const buildErrorPayload = (error, fallback = HttpStatusCodes.INTERNAL_SERVER_ERROR) => {
  if (error?.issues) {
    return {
      status: HttpStatusCodes.BAD_REQUEST.code,
      body: { message: "Parâmetros inválidos", details: error.issues },
    };
  }

  if (error?.response) {
    const upstreamCode = error.response.status;
    const upstreamMessage = error.response.data?.message || error.message;
    return {
      status: upstreamCode,
      body: {
        message: `Erro ao consultar Coletum: ${upstreamMessage}`,
        upstream: error.response.data ?? null,
      },
    };
  }

  return {
    status: fallback.code,
    body: { message: error?.message || fallback.message },
  };
};

export default buildErrorPayload;
