import express from "express";
// import swaggerJsDoc from "swagger-jsdoc";
// import swaggerUI from "swagger-ui-express";
// import getSwaggerOptions from "../docs/config/head.js";
// import users from "./UserRoute.js";
// import auth from "./AuthRoutes.js";
import suppliers from "./SuppliersRoute.js";

const routes = (app) => {
    // Configurando a documentação da Swagger UI para ser servida diretamente em '/'
    // const swaggerDocs = swaggerJsDoc(getSwaggerOptions());
    // app.use(swaggerUI.serve);
    // app.get("/", (req, res, next) => {
    //     swaggerUI.setup(swaggerDocs)(req, res, next);
    // });

    app.use(
        express.json(),
        // rotas
        // auth,
        // users,
        suppliers
    );

    // Se não é nenhuma rota válida, produz 404
    app.use((req, res) => {
        res.status(404).json({ message: "Rota não encontrada" });
    });
};

export default routes;