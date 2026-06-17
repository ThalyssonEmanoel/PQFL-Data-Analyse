import { Router } from "express";
import SuppliersCalculatedController from "../controllers/SuppliersCalculatedController.js";
import authenticate from "../middlewares/authenticate.js";
import authorize from "../middlewares/authorize.js";

const router = Router();

// Calcula e salva pontuacoes/classificacoes (escrita pesada) — admin.
router.post("/suppliers-calculated/calculate", authenticate, authorize("admin"), SuppliersCalculatedController.calculateAll);

// Historico de periodos de um produtor para comparacao (somente leitura) — admin ou member.
// Declarado antes da rota generica para nao ser capturado por ela.
router.get("/suppliers-calculated/periods", authenticate, SuppliersCalculatedController.producerPeriods);

// Lista fornecedores calculados com paginacao e filtros (somente leitura) — admin ou member.
router.get("/suppliers-calculated", authenticate, SuppliersCalculatedController.list);

export default router;
