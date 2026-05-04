import express from "express";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";
import getSwaggerOptions from "../docs/config/head.js";
import suppliers from "./SuppliersRoute.js";

// Registra documentacao, middlewares e rotas principais da API.
const routes = (app) => {
    // Gera e expõe a documentacao Swagger.
    const swaggerDocs = swaggerJsDoc(getSwaggerOptions());
    app.use("/docs", swaggerUI.serve, swaggerUI.setup(swaggerDocs));
    app.get("/docs.json", (_req, res) => res.json(swaggerDocs));
    app.get("/", (_req, res) => res.redirect("/docs"));

    // Ativa JSON parser e monta o roteador de fornecedores.
    app.use(
        express.json(),
        suppliers
    );

    // Fallback de rota nao encontrada.
    app.use((req, res) => {
        res.status(404).json({ message: "Rota não encontrada" });
    });
};

export default routes;
