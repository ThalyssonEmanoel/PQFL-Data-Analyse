import SuplliersPath from "../routes/SuppliersRoute.js";
import SuplliersSchema from "./schemas/suppliersSchema.js";

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
          name: "Supliers",
          description: "Supliers route."
        }
      ],
      paths: {
        ...SuplliersPath,
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