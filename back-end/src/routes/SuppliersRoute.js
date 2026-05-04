import { Router } from 'express';
import SuppliersController from '../controllers/SuppliersController.js';
// import AuthMiddleware from '../middlewares/authMiddleware.js';
// import errorHandler from "../middlewares/errorHandler.js";

const router = Router();

router.get('/suppliers/v1', SuppliersController.listAllSuppliers);
router.get('/suppliers', SuppliersController.listSuppliers); //Deve buscar no banco apenas as informações paginadas.
router.post('/suppliers/pull-all', SuppliersController.pullAllSuppliers);
router.post('/suppliers/pull-partial', SuppliersController.pullPartialSupplier);

export default router;