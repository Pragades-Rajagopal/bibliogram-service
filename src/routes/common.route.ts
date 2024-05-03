import { Router } from "express";
const router = Router();
import * as UserComponent from "../components/user.component";

/**
 * User routes
 */
router.post("/register", UserComponent.registerUser);
router.post("/login", UserComponent.userLogin);

export default router;
