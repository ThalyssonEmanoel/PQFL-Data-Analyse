import { Router } from "express";
import SuppliersCalculatedController from "../controllers/SuppliersCalculatedController.js";

const router = Router();

// Calcula e salva pontuacoes/classificacoes de todos os fornecedores em "suppliers-calculated".
router.post("/suppliers-calculated/calculate", SuppliersCalculatedController.calculateAll);

// Lista fornecedores calculados com paginacao e filtros opcionais (_id, nome).
router.get("/suppliers-calculated", SuppliersCalculatedController.list);

export default router;
