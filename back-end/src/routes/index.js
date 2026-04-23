import { Router } from "express";
import healthRoutes from "./health.routes.js";
import producerRoutes from "./producer.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/producers", producerRoutes);

export default router;
