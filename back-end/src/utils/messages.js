export const messages = {

  httpCodes: {
    200: "Requisição bem sucedida.",
    201: "Requisição bem sucedida, recurso foi criado",
    204: "Requisição bem sucedida, sem conteúdo para retornar",

    400: "Requisição com sintaxe incorreta ou outros problemas.",
    401: "Cliente sem credenciais para acessar o recurso solicitado.",
    403: "Sem permissão para atender a requisição.",
    404: "O recurso solicitado não foi encontrado no servidor.",
    409: "A requisição do cliente em conflito com o estado atual do servidor.",
    498: "Acesso negado devido o token ser inválido.",
    500: "Servidor encontrou um erro interno.",
    501: "Funcionalidade não suportada.",
  },

  error: {
    error: "Ocorreu um erro ao processar a solicitação.",
    serverError: "Erro interno do servidor. Tente novamente mais tarde.",
    invalidRequest: "Requisição inválida. Verifique os parâmetros fornecidos.",
    unauthorizedAccess: "Acesso não autorizado. Faça login para continuar.",
    invalidURL: "URL inválida. Verifique a URL fornecida.",
    unsupportedOperation: "Operação não suportada neste contexto.",
    dataParsingError: "Erro ao analisar os dados recebidos.",
    externalServiceError: "Erro ao se comunicar com um serviço externo.",
    internalServerError: "Erro ao se comunicar com um serviço interno.",
    invalidApiKey: "Chave de API inválida.",
    operationCanceled: "Operação cancelada pelo usuário.",
  },
  auth: { invalidPermission: "Permissão insuficiente para executar a operação.", invalidToken: "Token inválido. Faça login novamente.",},
};

export default messages;