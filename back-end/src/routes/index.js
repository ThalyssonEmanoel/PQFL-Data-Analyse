import swaggerJsDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";
import getSwaggerOptions from "../docs/config/head.js";
import auth from "./AuthRoute.js";
import suppliers from "./SuppliersRoute.js";
import suppliersCalculated from "./SuppliersCalculatedRoute.js";

// Registra a documentacao Swagger e monta os roteadores principais.
// Parsers, seguranca, 404 e errorHandler ficam centralizados em app.js.
const routes = (app) => {
    // Gera e expoe a documentacao Swagger.
    const swaggerDocs = swaggerJsDoc(getSwaggerOptions());
    app.use("/docs", swaggerUI.serve, swaggerUI.setup(swaggerDocs));
    app.get("/docs.json", (_req, res) => res.json(swaggerDocs));
    app.get("/", (_req, res) => res.redirect("/docs"));

    // Roteadores da aplicacao.
    app.use(auth, suppliers, suppliersCalculated);
};

export default routes;
