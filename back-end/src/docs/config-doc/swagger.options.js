import { openApiBase } from "./openapi.base.js";
import { components } from "../schemas-doc/index.js";
import { paths } from "../routes-doc/index.js";

export const swaggerJsdocOptions = {
  definition: {
    ...openApiBase,
    components,
    paths,
  },
  apis: [],
};
