import http from "./http.js";

// Camada de acesso aos endpoints de fornecedores (brutos e calculados).
// Fonte principal do dashboard: GET /suppliers-calculated (paginado).
// Formato de resposta paginada do back-end:
//   { data: [...], pagination: { page, page_size, total_items, total_pages, has_next } }

const suppliersService = {
  // GET /suppliers-calculated — admin ou member. Filtros: _id, nome.
  async listCalculated({ page = 1, pageSize = 50, id, nome } = {}) {
    const params = { page, page_size: pageSize };
    if (id) params._id = id;
    if (nome) params.nome = nome;
    const { data } = await http.get("/suppliers-calculated", { params });
    return data;
  },

  // Busca TODAS as paginas de calculados (para agregacoes do dashboard).
  // pageSize maximo aceito pelo back-end e 500.
  async listAllCalculated({ pageSize = 500, maxPages = 50 } = {}) {
    let page = 1;
    let all = [];
    let pagination = null;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const res = await this.listCalculated({ page, pageSize });
      all = all.concat(res.data || []);
      pagination = res.pagination;
      if (!pagination?.has_next || page >= maxPages) break;
      page += 1;
    }
    return { data: all, pagination };
  },

  // GET /suppliers-calculated/periods — historico de periodos de um produtor.
  // Retorna { producerId, producerName, supported, latestPeriodKey, periods, snapshots }.
  // `supported` so e true quando ha 2+ periodos comparaveis.
  async getProducerPeriods(producerId) {
    const { data } = await http.get("/suppliers-calculated/periods", {
      params: { producerId },
    });
    return data;
  },

  // GET /suppliers — fornecedores brutos (respostas originais do Coletum).
  async listSuppliers({ page = 1, pageSize = 50, id, nome } = {}) {
    const params = { page, page_size: pageSize };
    if (id) params.id = id;
    if (nome) params.nome = nome;
    const { data } = await http.get("/suppliers", { params });
    return data;
  },

  // POST /suppliers-calculated/calculate — admin. Recalcula e persiste todos.
  async calculateAll() {
    const { data } = await http.post("/suppliers-calculated/calculate", {});
    return data; // { message, result: { processed, totalInDatabase, groups, inPAECount, calculatedAt } }
  },

  // POST /suppliers/pull-all — admin. Sincronizacao completa com o Coletum.
  async pullAll() {
    const { data } = await http.post("/suppliers/pull-all", {});
    return data;
  },

  // POST /suppliers/pull-partial — admin. Sincronizacao incremental (delta).
  async pullPartial() {
    const { data } = await http.post("/suppliers/pull-partial", {});
    return data;
  },
};

export default suppliersService;
