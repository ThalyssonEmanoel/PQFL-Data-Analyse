import { Router } from 'express';
import SuppliersController from '../controllers/SuppliersController.js';
// import AuthMiddleware from '../middlewares/authMiddleware.js';
// import errorHandler from "../middlewares/errorHandler.js";

const router = Router();

// Lista todos os fornecedores, sincronizando quando necessário.
router.get('/suppliers/v1', SuppliersController.listAllSuppliers);
// Lista fornecedores paginados (somente do banco local).
router.get('/suppliers', SuppliersController.listSuppliers);
// Força sincronização completa com o Coletum.
router.post('/suppliers/pull-all', SuppliersController.pullAllSuppliers);
// Força sincronização incremental com base na data de atualização.
router.post('/suppliers/pull-partial', SuppliersController.pullPartialSupplier);

export default router;