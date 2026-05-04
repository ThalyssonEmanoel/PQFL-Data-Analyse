import SuppliersService from "../services/SuppliersService.js";
import HttpStatusCodes from "../utils/HttpStatusCodes.js";
import { listSuppliersQuerySchema } from "../schemas/supplierSchema.js";
import buildErrorPayload from "../utils/buildErrorPayload.js";

// Handlers HTTP para operacoes de fornecedores.
class SuppliersController {
  // Lista todos os fornecedores; sincroniza antes caso o banco esteja vazio ou haja delta.
  static async listAllSuppliers(req, res) {
    try {
      const service = new SuppliersService();
      const totalInDatabase = await service.listAllFromDatabase();
      if (totalInDatabase.total === 0) {
        const sync = await service.pullAll();
        const fresh = await service.listAllFromDatabase();
        return res.status(HttpStatusCodes.OK.code).json({ ...fresh, sync });
      }
      const sync = await service.pullPartial();
      const fresh = await service.listAllFromDatabase();
      return res.status(HttpStatusCodes.OK.code).json({ ...fresh, sync });
    } catch (error) {
      const { status, body } = buildErrorPayload(error);
      return res.status(status).json(body);
    }
  }

  // Lista fornecedores com paginacao, validando os parametros da query string.
  static async listSuppliers(req, res) {
    try {
      const query = listSuppliersQuerySchema.parse(req.query);
      const service = new SuppliersService();
      const result = await service.listPaginated({ page: query.page, pageSize: query.page_size });
      return res.status(HttpStatusCodes.OK.code).json(result);
    } catch (error) {
      const { status, body } = buildErrorPayload(error);
      return res.status(status).json(body);
    }
  }

  // Dispara sincronizacao completa com o Coletum.
  static async pullAllSuppliers(req, res) {
    try {
      const service = new SuppliersService();
      const sync = await service.pullAll();
      return res.status(HttpStatusCodes.OK.code).json({ message: "Sincronização completa concluída", sync });
    } catch (error) {
      const { status, body } = buildErrorPayload(error);
      return res.status(status).json(body);
    }
  }

  // Dispara sincronizacao incremental (delta) com o Coletum.
  static async pullPartialSupplier(req, res) {
    try {
      const service = new SuppliersService();
      const sync = await service.pullPartial();
      return res.status(HttpStatusCodes.OK.code).json({ message: "Sincronização incremental concluída", sync });
    } catch (error) {
      const { status, body } = buildErrorPayload(error);
      return res.status(status).json(body);
    }
  }
}

export default SuppliersController;
