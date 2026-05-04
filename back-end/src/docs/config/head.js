import SuplliersPath from "../routes/SuppliersRoute.js";
import SuplliersSchema from "./schemas/suppliersSchema.js";
import SuppliersCalculatedPath from "../routes/SuppliersCalculatedRoute.js";
import SuppliersCalculatedSchema from "./schemas/suppliersCalculatedSchema.js";

// Function to define the server URLs depending on the environment
const getServersInCorrectOrder = () => {
  const devUrl = { url: process.env.SWAGGER_DEV_URL || "http://localhost:8080" };
  const prodUrl = { url: process.env.SWAGGER_PROD_URL || "https://exemplo" };

  if (process.env.NODE_ENV === "production") return [prodUrl];
  else return [devUrl];
};

// Function to obtain Swagger options
const getSwaggerOptions = () => {
  return {
    swaggerDefinition: {
      openapi: "3.0.0",
      info: {
        title: "PQFL - Back End API Documentation",
        version: "1.0-alpha",
        description: "PQFL - Data Analyse - Back End API documentation.",
      },
      servers: getServersInCorrectOrder(),
      tags: [
        {
          name: "Suppliers",
          description: "Sincronizacao com Coletum e leitura de fornecedores."
        },
        {
          name: "SuppliersCalculated",
          description: "Calculo BPA (PQFL) e leitura dos fornecedores classificados."
        }
      ],
      paths: {
        ...SuplliersPath,
        ...SuppliersCalculatedPath,
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT"
          }
        },
        schemas: {
            ...SuplliersSchema,
            ...SuppliersCalculatedSchema,
        }
      },
      security: [{
        bearerAuth: []
      }]
    },
    apis: ["./src/routes/*.js"]
  };
};

export default getSwaggerOptions;