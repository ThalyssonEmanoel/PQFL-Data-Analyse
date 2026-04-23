import { healthPaths } from "./health.routes-doc.js";
import { producerPaths } from "./producer.routes-doc.js";

export const paths = {
  ...healthPaths,
  ...producerPaths,
};
