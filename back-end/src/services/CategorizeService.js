import SupplierRepository from "../repositories/SupplierRepository.js";
import SupplierCalculatedRepository from "../repositories/SupplierCalculatedRepository.js";
import { mapAndScoreProducer } from "./Categorize/scoring.js";
import coletumConfig from "../config/coletum.js";

// Escapa caracteres especiais usados em regex para buscas textuais seguras.
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Extrai o nome do fornecedor a partir do payload original (answer._nome350925).
const extractProducerName = (supplier, fallback) => {
  const direct = supplier?.answer?._nome350925;
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  return fallback ?? null;
};

// Monta o documento a ser persistido em "suppliers-calculated".
const buildCalculatedDoc = (supplier, scoreResult) => ({
  _id: supplier._id,
  coletumId: supplier.coletumId,
  formId: supplier.formId,
  producerId: scoreResult.producerId,
  producerName: extractProducerName(supplier, scoreResult.producerName),
  group: scoreResult.group,
  totalScore: scoreResult.totalScore,
  categoryScores: scoreResult.categoryScores,
  actions: scoreResult.actions,
  metrics: scoreResult.metrics,
  unmappedScoredFields: scoreResult.unmappedScoredFields ?? [],
  calculatedAt: new Date(),
});

// Orquestra o calculo de pontuacao/classificacao e persiste em "suppliers-calculated".
class CategorizeService {
  constructor({ formId } = {}) {
    this.formId = formId ?? coletumConfig.formId;
  }

  // Calcula todos os fornecedores presentes no Mongo e faz upsert incremental.
  async calculateAll() {
    const suppliers = await SupplierRepository.findAllByFormId(this.formId);
    let processed = 0;
    const groupCounts = { G1: 0, G2: 0, G3: 0 };
    const inPaeIds = [];

    for (const supplier of suppliers) {
      const scoreResult = mapAndScoreProducer(supplier.answer ?? {});
      const doc = buildCalculatedDoc(supplier, scoreResult);
      await SupplierCalculatedRepository.upsertBySupplierId(supplier._id, doc);

      processed += 1;
      groupCounts[scoreResult.group] = (groupCounts[scoreResult.group] ?? 0) + 1;
      if (scoreResult.actions?.inPAE) inPaeIds.push(String(supplier._id));
    }

    const totalInDatabase = await SupplierCalculatedRepository.countByFormId(this.formId);
    return {
      processed,
      totalInDatabase,
      groups: groupCounts,
      inPAECount: inPaeIds.length,
      calculatedAt: new Date().toISOString(),
    };
  }

  // Lista calculados paginados; aceita filtros por _id e nome (regex em producerName).
  async listPaginated({ page = 1, pageSize = 50, id, nome } = {}) {
    const skip = (page - 1) * pageSize;
    const filters = {};
    if (id) filters._id = id;
    if (nome) filters.producerName = { $regex: escapeRegex(nome), $options: "i" };

    const [items, total] = await Promise.all([
      SupplierCalculatedRepository.findPaginatedByFormId(this.formId, {
        skip,
        limit: pageSize,
        filters,
      }),
      SupplierCalculatedRepository.countByFormId(this.formId, filters),
    ]);

    return {
      data: items,
      pagination: {
        page,
        page_size: pageSize,
        total_items: total,
        total_pages: Math.max(1, Math.ceil(total / pageSize)),
        has_next: skip + items.length < total,
      },
    };
  }
}

export default CategorizeService;
