const tag = "Suppliers";

const syncResultSchema = { $ref: "#/components/schemas/SyncResult" };
const supplierSchema = { $ref: "#/components/schemas/Supplier" };

const SuppliersPath = {
  "/suppliers/v1": {
    get: {
      tags: [tag],
      summary: "Listar todos os fornecedores (com sincronização automática)",
      description:
        "Se o banco estiver vazio, executa um pull completo do Coletum (até 4 requisições). Caso contrário, executa um pull incremental usando `updated_after` antes de retornar todos os registros.",
      responses: {
        200: {
          description: "Lista completa de fornecedores acompanhada do resumo da sincronização.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  total: { type: "integer", example: 794 },
                  data: { type: "array", items: supplierSchema },
                  sync: syncResultSchema,
                },
              },
            },
          },
        },
        429: { description: "Cota mensal do Coletum esgotada." },
        500: { description: "Erro interno." },
      },
    },
  },
  "/suppliers": {
    get: {
      tags: [tag],
      summary: "Listar fornecedores paginados (somente do banco local)",
      description: "Retorna apenas registros já presentes no MongoDB, sem chamar o Coletum.",
      parameters: [
        {
          name: "page",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, default: 1 },
        },
        {
          name: "page_size",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, maximum: 500, default: 50 },
        },
      ],
      responses: {
        200: {
          description: "Página de fornecedores.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  data: { type: "array", items: supplierSchema },
                  pagination: { $ref: "#/components/schemas/Pagination" },
                },
              },
            },
          },
        },
        400: { description: "Parâmetros inválidos." },
      },
    },
  },
  "/suppliers/pull-all": {
    post: {
      tags: [tag],
      summary: "Forçar sincronização completa com o Coletum",
      description:
        "Ignora o estado de sincronização e busca todas as páginas do formulário (limitado a 4 requisições por execução).",
      responses: {
        200: {
          description: "Sincronização concluída.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string" },
                  sync: syncResultSchema,
                },
              },
            },
          },
        },
        429: { description: "Cota mensal do Coletum esgotada." },
      },
    },
  },
  "/suppliers/pull-partial": {
    post: {
      tags: [tag],
      summary: "Sincronização incremental (Delta Sync)",
      description:
        "Usa o último `lastSyncedAt` como `updated_after` na chamada ao Coletum. Se o banco estiver vazio, executa um pull completo automaticamente.",
      responses: {
        200: {
          description: "Sincronização incremental concluída.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string" },
                  sync: syncResultSchema,
                },
              },
            },
          },
        },
        429: { description: "Cota mensal do Coletum esgotada." },
      },
    },
  },
};

export default SuppliersPath;
