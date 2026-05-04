import express from "express";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";
import getSwaggerOptions from "../docs/config/head.js";
import suppliers from "./SuppliersRoute.js";

const routes = (app) => {
    const swaggerDocs = swaggerJsDoc(getSwaggerOptions());
    app.use("/docs", swaggerUI.serve, swaggerUI.setup(swaggerDocs));
    app.get("/docs.json", (_req, res) => res.json(swaggerDocs));
    app.get("/", (_req, res) => res.redirect("/docs"));

    app.use(
        express.json(),
        suppliers
    );

    app.use((req, res) => {
        res.status(404).json({ message: "Rota não encontrada" });
    });
};

export default routes;
