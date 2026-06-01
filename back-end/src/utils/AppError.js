// Erro de aplicacao com status HTTP e codigo simbolico. Lancado pelos services e
// mapeado pelo errorHandler central num payload consistente.
class AppError extends Error {
  constructor(message, statusCode = 500, code = undefined, details = undefined) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}

export default AppError;
