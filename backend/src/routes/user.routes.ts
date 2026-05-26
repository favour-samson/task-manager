import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

const router = Router();

router.get("/", authenticate, authorize("admin"), userController.getUsers);

export default router;
