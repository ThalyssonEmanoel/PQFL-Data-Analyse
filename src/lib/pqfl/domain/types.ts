export type BPACategoryKey =
  | "gestaoPropriedade"
  | "manejoSanitario"
  | "manejoOrdenhaPosOrdenha"
  | "refrigeracaoEstocagemLeite"
  | "manejoAlimentarArmazenamento"
  | "qualidadeAgua"
  | "usoRacionalQuimicos"
  | "manejoResiduos"
  | "manutencaoPreventiva"
  | "capacitacaoControlePragas";

export type ProducerGroup = "G1" | "G2" | "G3";

export interface BPACategoryWeight {
  key: BPACategoryKey;
  label: string;
  weight: number;
}

export interface BPACategoryScore {
  key: BPACategoryKey;
  label: string;
  weight: number;
  rawScore: number;
  weightedScore: number;
  questionCount: number;
  matchedFields: string[];
}

export interface FactorDiagnostic {
  key: BPACategoryKey;
  label: string;
  conformity: number;
  gap: number;
  checkedFields: string[];
  failedFields: string[];
  failedFieldLabels: string[];
}

export interface ProducerActions {
  inPAE: boolean;
  paeReasons: string[];
  paeActions: string[];
  pbpaCategories: BPACategoryKey[];
  pbpaActions: string[];
  factorDiagnostics: FactorDiagnostic[];
}

export interface ProducerScoreResult {
  producerId: string;
  producerName: string;
  totalScore: number;
  group: ProducerGroup;
  categoryScores: Record<BPACategoryKey, BPACategoryScore>;
  actions: ProducerActions;
  metrics: {
    cpp: number | null;
    hasResidue: boolean;
  };
  unmappedScoredFields: string[];
  rawPayload: Record<string, unknown>;
}

export interface ScoringOptions {
  lowScoreThreshold: number;
  categoryFieldHints: Partial<Record<BPACategoryKey, string[]>>;
  cppFieldHints: string[];
  residueFieldHints: string[];
  idFieldHints: string[];
  nameFieldHints: string[];
}

export type ProducerDataSourceKind = "coletum" | "mock";

export interface ProducerCacheMeta {
  source: ProducerDataSourceKind;
  updatedAt: string | null;
  endpointConfigured: boolean;
  remoteRequestCount: number;
  requestBudget: number;
  remainingRequests: number;
  lastRemoteAttemptAt: string | null;
  lastRemoteSuccessAt: string | null;
}

export interface ProducerDataSourceResult {
  payloads: Record<string, unknown>[];
  meta: ProducerCacheMeta;
}

export type ProducerRefreshStatus =
  | "updated"
  | "missing-endpoint"
  | "blocked-budget"
  | "remote-error";

export interface ProducerRefreshResult {
  ok: boolean;
  status: ProducerRefreshStatus;
  message: string;
  payloadCount: number;
  meta: ProducerCacheMeta;
}
