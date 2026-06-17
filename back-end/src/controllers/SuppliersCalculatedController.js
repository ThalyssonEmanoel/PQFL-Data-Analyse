import CategorizeService from "../services/CategorizeService.js";
import HttpStatusCodes from "../utils/HttpStatusCodes.js";
import buildErrorPayload from "../utils/buildErrorPayload.js";
import {
  listCalculatedQuerySchema,
  producerPeriodsQuerySchema,
} from "../schemas/supplierCalculatedSchema.js";

// Handlers HTTP para o catalogo de fornecedores calculados.
class SuppliersCalculatedController {
  // Calcula pontuacoes/classificacoes de TODOS os fornecedores e faz upsert incremental.
  static async calculateAll(req, res) {
    try {
      const service = new CategorizeService();
      const result = await service.calculateAll();
      return res.status(HttpStatusCodes.OK.code).json({
        message: "Calculo concluido",
        result,
      });
    } catch (error) {
      const { status, body } = buildErrorPayload(error);
      return res.status(status).json(body);
    }
  }

  // Lista fornecedores calculados com paginacao e filtros (_id, nome).
  static async list(req, res) {
    try {
      const query = listCalculatedQuerySchema.parse(req.query);
      const service = new CategorizeService();
      const result = await service.listPaginated({
        page: query.page,
        pageSize: query.page_size,
        id: query._id,
        nome: query.nome,
      });
      return res.status(HttpStatusCodes.OK.code).json(result);
    } catch (error) {
      const { status, body } = buildErrorPayload(error);
      return res.status(status).json(body);
    }
  }

  // Retorna o historico de periodos de um produtor (para comparacao entre periodos).
  static async producerPeriods(req, res) {
    try {
      const query = producerPeriodsQuerySchema.parse(req.query);
      const service = new CategorizeService();
      const result = await service.getProducerPeriodHistory(query.producerId);
      return res.status(HttpStatusCodes.OK.code).json(result);
    } catch (error) {
      const { status, body } = buildErrorPayload(error);
      return res.status(status).json(body);
    }
  }
}

export default SuppliersCalculatedController;
