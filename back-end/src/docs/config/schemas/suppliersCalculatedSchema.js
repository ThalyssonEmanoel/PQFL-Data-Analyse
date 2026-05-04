const SuppliersCalculatedSchema = {
  CategoryScore: {
    type: "object",
    properties: {
      key: { type: "string", example: "manejoSanitario" },
      label: { type: "string", example: "Manejo sanitario" },
      weight: { type: "number", example: 20 },
      rawScore: { type: "number", example: 0.6 },
      weightedScore: { type: "number", example: 12 },
      questionCount: { type: "integer", example: 5 },
      matchedFields: { type: "array", items: { type: "string" } },
    },
  },
  FactorDiagnostic: {
    type: "object",
    properties: {
      key: { type: "string" },
      label: { type: "string" },
      conformity: { type: "number" },
      gap: { type: "number" },
      checkedFields: { type: "array", items: { type: "string" } },
      failedFields: { type: "array", items: { type: "string" } },
      failedFieldLabels: { type: "array", items: { type: "string" } },
    },
  },
  CalculatedActions: {
    type: "object",
    properties: {
      inPAE: { type: "boolean" },
      paeReasons: { type: "array", items: { type: "string" } },
      pbpaCategories: { type: "array", items: { type: "string" } },
      pbpaActions: { type: "array", items: { type: "string" } },
      paeActions: { type: "array", items: { type: "string" } },
      factorDiagnostics: {
        type: "array",
        items: { $ref: "#/components/schemas/FactorDiagnostic" },
      },
    },
  },
  SupplierCalculated: {
    type: "object",
    properties: {
      _id: { type: "string", description: "Mesmo _id do fornecedor em `suppliers`." },
      coletumId: { type: "string" },
      formId: { type: "string" },
      producerId: { type: "string", nullable: true },
      producerName: { type: "string", nullable: true },
      group: { type: "string", enum: ["G1", "G2", "G3"] },
      totalScore: { type: "number" },
      categoryScores: {
        type: "object",
        additionalProperties: { $ref: "#/components/schemas/CategoryScore" },
      },
      actions: { $ref: "#/components/schemas/CalculatedActions" },
      metrics: {
        type: "object",
        properties: {
          cpp: { type: "number", nullable: true },
          hasResidue: { type: "boolean" },
        },
      },
      unmappedScoredFields: { type: "array", items: { type: "string" } },
      calculatedAt: { type: "string", format: "date-time" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  CalculateAllResult: {
    type: "object",
    properties: {
      processed: { type: "integer", example: 794 },
      totalInDatabase: { type: "integer", example: 794 },
      groups: {
        type: "object",
        properties: {
          G1: { type: "integer", example: 120 },
          G2: { type: "integer", example: 380 },
          G3: { type: "integer", example: 294 },
        },
      },
      inPAECount: { type: "integer", example: 12 },
      calculatedAt: { type: "string", format: "date-time" },
    },
  },
};

export default SuppliersCalculatedSchema;
