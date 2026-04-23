import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { swaggerJsdocOptions } from "./config-doc/swagger.options.js";

const openApiSpec = swaggerJsdoc(swaggerJsdocOptions);

export function mountSwagger(app, { path = "/docs" } = {}) {
  app.get(`${path}.json`, (_req, res) => {
    res.json(openApiSpec);
  });
  app.use(path, swaggerUi.serve, swaggerUi.setup(openApiSpec));
}

export { openApiSpec };
