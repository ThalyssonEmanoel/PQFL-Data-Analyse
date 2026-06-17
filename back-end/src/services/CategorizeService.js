import SupplierRepository from "../repositories/SupplierRepository.js";
import SupplierCalculatedRepository from "../repositories/SupplierCalculatedRepository.js";
import { mapAndScoreProducer } from "./Categorize/scoring.js";
import { buildProducerPeriodDataset } from "./Categorize/period-dataset.js";
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

  // Reconstroi o historico de periodos de um produtor a partir dos envios brutos
  // (collection "suppliers"), inferindo o periodo de cada submissao. Permite que o
  // front-end compare o periodo mais recente com periodos anteriores.
  //
  // `supported` indica se ha mais de um periodo comparavel: somente nesse caso o
  // front-end deve oferecer a opcao de comparacao por periodo.
  async getProducerPeriodHistory(producerId) {
    const suppliers = await SupplierRepository.findAllByFormId(this.formId);
    const dataset = buildProducerPeriodDataset(suppliers.map((s) => s.answer ?? {}));

    const snapshots = dataset.byProducerId[producerId] ?? [];

    if (!snapshots.length) {
      return {
        producerId,
        producerName: null,
        supported: false,
        latestPeriodKey: null,
        periods: [],
        snapshots: {},
      };
    }

    // Periodos deste produtor, do mais recente para o mais antigo.
    const periodsMap = new Map();
    for (const snap of snapshots) {
      if (!periodsMap.has(snap.periodKey)) {
        periodsMap.set(snap.periodKey, {
          key: snap.periodKey,
          label: snap.periodLabel,
          sortOrder: snap.periodSortOrder,
        });
      }
    }
    const periods = Array.from(periodsMap.values()).sort((a, b) => b.sortOrder - a.sortOrder);

    // Um snapshot (ja deduplicado) por periodo, com os dados ja pontuados.
    const byPeriod = {};
    for (const snap of snapshots) {
      const p = snap.producer;
      byPeriod[snap.periodKey] = {
        periodKey: snap.periodKey,
        periodLabel: snap.periodLabel,
        recordedAt: snap.recordedAt,
        producerName: p.producerName,
        totalScore: p.totalScore,
        group: p.group,
        categoryScores: p.categoryScores,
        metrics: p.metrics,
        actions: p.actions,
      };
    }

    const latestPeriodKey = periods[0]?.key ?? null;
    const producerName = byPeriod[latestPeriodKey]?.producerName ?? null;

    return {
      producerId,
      producerName,
      // Comparacao so faz sentido (e so deve aparecer no front) com 2+ periodos reais.
      supported: periods.length > 1,
      latestPeriodKey,
      periods,
      snapshots: byPeriod,
    };
  }
}

export default CategorizeService;
