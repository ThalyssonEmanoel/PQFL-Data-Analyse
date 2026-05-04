import axios from "axios";
import coletumConfig from "../config/coletum.js";
import { coletumAnswerListSchema } from "../schemas/supplierSchema.js";

// Cliente de acesso ao Coletum com controle de cota local de requisicoes.
class ColetumService {
  // Inicializa o cliente HTTP e limites de requisicao a partir da configuracao.
  constructor(config = coletumConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 30_000,
      headers: { Token: config.token },
    });
    this.requestCount = 0;
  }

  // Zera o contador de requisicoes da execucao atual.
  resetRequestCount() {
    this.requestCount = 0;
  }

  // Retorna quantas requisicoes ainda podem ser feitas nesta execucao.
  remainingBudget() {
    return Math.max(0, this.config.maxRequestsPerRun - this.requestCount);
  }

  // Busca uma pagina de respostas no Coletum e valida o schema.
  async fetchAnswersPage({ page = 1, pageSize, updatedAfter } = {}) {
    if (this.requestCount >= this.config.maxRequestsPerRun) {
      throw new Error(
        `Cota local de requisições atingida (${this.config.maxRequestsPerRun}). Abortando para preservar a cota mensal do Coletum.`
      );
    }

    const params = {
      page,
      page_size: pageSize ?? this.config.pageSize,
    };
    if (updatedAfter) params.updated_after = updatedAfter;

    const url = `/forms/${this.config.formId}/answers`;
    this.requestCount += 1;

    const { data } = await this.client.get(url, { params });
    const parsed = coletumAnswerListSchema.parse(data);
    return parsed;
  }

  // Itera de forma paginada sobre todas as respostas, respeitando a cota local.
  async *iterateAnswers({ updatedAfter } = {}) {
    let page = 1;
    while (true) {
      const result = await this.fetchAnswersPage({ page, updatedAfter });
      for (const answer of result.data) {
        yield answer;
      }
      if (!result.pagination.has_next) break;
      if (this.requestCount >= this.config.maxRequestsPerRun) {
        throw new Error(
          `Cota local de requisições atingida (${this.config.maxRequestsPerRun}). Sincronização interrompida em ${page} páginas; retome em uma próxima execução.`
        );
      }
      page += 1;
    }
  }
}

export default ColetumService;
