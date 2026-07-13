import mongoose from "mongoose";

const { Schema } = mongoose;

// Estrutura por categoria BPA (rawScore, weightedScore, etc.).
const CategoryScoreSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    weight: { type: Number, required: true },
    rawScore: { type: Number, required: true },
    weightedScore: { type: Number, required: true },
    questionCount: { type: Number, default: 0 },
    matchedFields: { type: [String], default: [] },
  },
  { _id: false }
);

// Detalhamento por campo oficial (pergunta do checklist) dentro de uma categoria.
const DiagnosticFieldSchema = new Schema(
  {
    questionId: { type: String, default: null },
    label: { type: String, required: true },
    fieldName: { type: String, default: null },
    imprescindivel: { type: Boolean, default: false },
    found: { type: Boolean, default: false },
    conforming: { type: Boolean, default: false },
  },
  { _id: false }
);

// Diagnostico oficial de campos por categoria.
const FactorDiagnosticSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    conformity: { type: Number, required: true },
    gap: { type: Number, required: true },
    checkedFields: { type: [String], default: [] },
    failedFields: { type: [String], default: [] },
    failedFieldLabels: { type: [String], default: [] },
    definedCount: { type: Number, default: 0 },
    foundCount: { type: Number, default: 0 },
    missingFields: { type: [String], default: [] },
    fields: { type: [DiagnosticFieldSchema], default: [] },
  },
  { _id: false }
);

// Cobertura de campos oficiais (comparacao com os campos presentes no Coletum).
const OfficialFieldsCoverageSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    definedCount: { type: Number, default: 0 },
    foundCount: { type: Number, default: 0 },
    missingFields: { type: [String], default: [] },
  },
  { _id: false }
);

// Planos de acao calculados (PAE / PBPA) e diagnostico.
const ActionsSchema = new Schema(
  {
    inPAE: { type: Boolean, default: false },
    paeReasons: { type: [String], default: [] },
    pbpaCategories: { type: [String], default: [] },
    pbpaActions: { type: [String], default: [] },
    paeActions: { type: [String], default: [] },
    factorDiagnostics: { type: [FactorDiagnosticSchema], default: [] },
  },
  { _id: false }
);

const SupplierCalculatedSchema = new Schema(
  {
    // _id do documento e o mesmo _id do fornecedor em "suppliers".
    _id: { type: Schema.Types.ObjectId, required: true },
    coletumId: { type: String, required: true, index: true },
    formId: { type: String, required: true, index: true },
    producerId: { type: String, default: null },
    producerName: { type: String, default: null, index: true },
    group: { type: String, enum: ["G1", "G2", "G3"], required: true, index: true },
    totalScore: { type: Number, required: true },
    categoryScores: { type: Map, of: CategoryScoreSchema, default: {} },
    actions: { type: ActionsSchema, required: true },
    metrics: {
      type: new Schema(
        {
          cpp: { type: Number, default: null },
          hasResidue: { type: Boolean, default: false },
        },
        { _id: false }
      ),
      default: () => ({}),
    },
    officialFieldsCoverage: { type: [OfficialFieldsCoverageSchema], default: [] },
    unmappedScoredFields: { type: [String], default: [] },
    calculatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "suppliers-calculated", _id: false }
);

const SupplierCalculated =
  mongoose.models.SupplierCalculated ||
  mongoose.model("SupplierCalculated", SupplierCalculatedSchema);

export default SupplierCalculated;
