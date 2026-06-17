const tag = "SuppliersCalculated";

const SuppliersCalculatedPath = {
  "/suppliers-calculated/calculate": {
    post: {
      tags: [tag],
      summary: "Calcular pontuacoes/classificacoes de TODOS os fornecedores",
      description:
        "**Permissao:** admin (operacao de escrita pesada). " +
        "Le todos os fornecedores presentes no Mongo (collection `suppliers`), executa o calculo BPA (scoring) e faz upsert incremental no banco `suppliers-calculated`. Nenhum registro existente e apagado.",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Calculo concluido.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "Calculo concluido" },
                  result: { $ref: "#/components/schemas/CalculateAllResult" },
                },
              },
            },
          },
        },
        401: { description: "Nao autenticado." },
        403: { description: "Sem permissao (requer admin)." },
        500: { description: "Erro interno." },
      },
    },
  },
  "/suppliers-calculated/periods": {
    get: {
      tags: [tag],
      summary: "Historico de periodos de um produtor (comparacao entre periodos)",
      description:
        "**Permissao:** admin ou member (somente leitura). " +
        "Reconstroi, a partir dos envios brutos (collection `suppliers`), os periodos em que o produtor possui dados, ja pontuados. " +
        "O campo `supported` indica se ha 2 ou mais periodos comparaveis — o front-end so deve oferecer a comparacao por periodo quando `supported = true`.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "producerId",
          in: "query",
          required: true,
          description: "Identificador do produtor (campo `producerId` retornado em `suppliers-calculated`).",
          schema: { type: "string" },
          example: "12345",
        },
      ],
      responses: {
        200: {
          description: "Historico de periodos do produtor.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProducerPeriodHistory" },
            },
          },
        },
        400: { description: "Parametros invalidos (producerId ausente)." },
        401: { description: "Nao autenticado." },
      },
    },
  },
  "/suppliers-calculated": {
    get: {
      tags: [tag],
      summary: "Listar fornecedores calculados (paginado)",
      description:
        "**Permissao:** admin ou member (somente leitura). " +
        "Retorna documentos da collection `suppliers-calculated` com paginacao e filtros opcionais. O filtro `nome` e aplicado sobre `producerName` (denormalizado a partir de `answer._nome350925` do payload original).",
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
        {
          name: "_id",
          in: "query",
          required: false,
          description: "Filtra pelo _id do documento (mesmo _id do fornecedor em `suppliers`).",
          schema: { type: "string", pattern: "^[0-9a-fA-F]{24}$" },
          example: "69f8cafee1d7191c60896ade",
        },
        {
          name: "nome",
          in: "query",
          required: false,
          description: "Filtra por nome (regex case-insensitive em producerName / answer._nome350925).",
          schema: { type: "string" },
          example: "Eliane",
        },
      ],
      responses: {
        200: {
          description: "Pagina de fornecedores calculados.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  data: {
                    type: "array",
                    items: { $ref: "#/components/schemas/SupplierCalculated" },
                  },
                  pagination: { $ref: "#/components/schemas/Pagination" },
                },
              },
            },
          },
        },
        400: { description: "Parametros invalidos." },
        401: { description: "Nao autenticado." },
      },
    },
  },
};

export default SuppliersCalculatedPath;
