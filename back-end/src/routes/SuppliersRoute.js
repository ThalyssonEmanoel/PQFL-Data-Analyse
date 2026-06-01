import { Router } from 'express';
import SuppliersController from '../controllers/SuppliersController.js';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';

const router = Router();

// Regra (secao 2): rotas que falam com o Coletum sao SOMENTE admin; rotas que apenas
// leem do banco sao acessiveis a admin e member.

// Lista todos os fornecedores, sincronizando com o Coletum quando necessario — admin.
router.get('/suppliers/v1', authenticate, authorize('admin'), SuppliersController.listAllSuppliers);
// Lista fornecedores paginados (somente do banco local) — admin ou member.
router.get('/suppliers', authenticate, SuppliersController.listSuppliers);
// Forca sincronizacao completa com o Coletum — admin.
router.post('/suppliers/pull-all', authenticate, authorize('admin'), SuppliersController.pullAllSuppliers);
// Forca sincronizacao incremental com base na data de atualizacao — admin.
router.post('/suppliers/pull-partial', authenticate, authorize('admin'), SuppliersController.pullPartialSupplier);

export default router;
