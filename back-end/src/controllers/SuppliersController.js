import SuppliersService from "../services/SuppliersService.js";
import HttpStatusCodes from "../utils/HttpStatusCodes.js";
import { listSuppliersQuerySchema } from "../schemas/supplierSchema.js";

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

class SuppliersController {
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
