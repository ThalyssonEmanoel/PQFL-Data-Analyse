const SuppliersSchema = {
  Pagination: {
    type: "object",
    properties: {
      page: { type: "integer", example: 1 },
      page_size: { type: "integer", example: 50 },
      total_items: { type: "integer", example: 794 },
      total_pages: { type: "integer", example: 16 },
      has_next: { type: "boolean", example: true },
    },
  },
  AnswerMetaData: {
    type: "object",
    properties: {
      created_at: { type: "string", format: "date-time" },
      updated_at: { type: "string", format: "date-time", nullable: true },
      created_by_user_id: { type: "integer", nullable: true },
      created_by_user_name: { type: "string", nullable: true },
      updated_by_user_id: { type: "integer", nullable: true },
      updated_by_user_name: { type: "string", nullable: true },
      created_at_source: { type: "string", nullable: true },
      updated_at_source: { type: "string", nullable: true },
      total_size: { type: "integer", example: 8153579 },
      created_at_coordinates: { type: "object", nullable: true },
      updated_at_coordinates: { type: "object", nullable: true },
    },
  },
  Supplier: {
    type: "object",
    properties: {
      coletumId: { type: "string", example: "25986.27" },
      formId: { type: "string", example: "26738" },
      answer: {
        type: "object",
        additionalProperties: true,
        description:
          "Objeto de respostas dinâmico do Coletum. As chaves são os identificadores humanizados dos componentes do formulário (ex: `_nome350925`).",
      },
      meta_data: { $ref: "#/components/schemas/AnswerMetaData" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  SyncResult: {
    type: "object",
    properties: {
      imported: { type: "integer", example: 794 },
      totalInDatabase: { type: "integer", example: 794 },
      requestsUsed: { type: "integer", example: 2 },
      lastSyncedAt: { type: "string", format: "date-time", nullable: true },
      strategy: { type: "string", example: "delta", nullable: true },
      updatedAfter: { type: "string", format: "date-time", nullable: true },
    },
  },
};

export default SuppliersSchema;
