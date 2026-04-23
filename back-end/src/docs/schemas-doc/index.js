import {
  Producer,
  ProducerActions,
  ProducerCategoryScore,
  FactorDiagnostic,
  ProducerList,
} from "./producer.schema-doc.js";
import { HealthStatus } from "./health.schema-doc.js";
import {
  ApiError,
  ValidationIssue,
  ValidationErrorResponse,
} from "./error.schema-doc.js";

export const components = {
  schemas: {
    Producer,
    ProducerActions,
    ProducerCategoryScore,
    FactorDiagnostic,
    ProducerList,
    HealthStatus,
    ApiError,
    ValidationIssue,
    ValidationErrorResponse,
  },
};
