import { Router } from "express";
import { producerController } from "../controllers/producer.controller.js";
import { validate } from "../middlewares/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  listProducersQuerySchema,
  producerIdParamsSchema,
} from "../schemas/producer.schema.js";
import { refreshOptionsSchema } from "../schemas/producer-refresh.schema.js";

const router = Router();

router.get(
  "/",
  validate({ query: listProducersQuerySchema }),
  asyncHandler(producerController.list),
);

router.post(
  "/refresh",
  validate({ body: refreshOptionsSchema }),
  asyncHandler(producerController.refresh),
);

router.get(
  "/:id",
  validate({ params: producerIdParamsSchema }),
  asyncHandler(producerController.getById),
);

export default router;
