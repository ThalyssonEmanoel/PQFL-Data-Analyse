class HttpStatusCodes {
  static OK = { code: 200, message: 'Requisição bem-sucedida' };
  static CREATED = { code: 201, message: 'Recurso criado com sucesso' };
  static NO_CONTENT = { code: 204, message: 'Sem conteúdo para retornar' };

  static BAD_REQUEST = { code: 400, message: 'Requisição com sintaxe incorreta' };
  static UNAUTHORIZED = { code: 401, message: 'Não autorizado' };
  static FORBIDDEN = { code: 403, message: 'Acesso proibido' };
  static NOT_FOUND = { code: 404, message: 'Recurso não encontrado' };
  static CONFLICT = { code: 409, message: 'Conflito com o estado atual do servidor' };
  // static IM_A_TEAPOT = { code: 418, message: 'Eu sou um bule de chá' };
  static TOO_MANY_REQUESTS = { code: 429 , message: 'Requisições excessivas!' };//Usar pra quando alguém perder a linha -> UserRegister
  static INVALID_TOKEN = { code: 498, message: 'O token JWT está expirado!' };

  static INTERNAL_SERVER_ERROR = { code: 500, message: 'Erro interno do servidor' };
}

export default HttpStatusCodes;