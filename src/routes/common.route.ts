import { Router } from "express";
const router = Router();
import * as UserComponent from "../components/user.component";
import { authenticateToken } from "../services/middleware";

/**
 * User routes
 */
router.post("/register", UserComponent.registerUser);
router.post("/login", UserComponent.userLogin);
router.post(
  "/deactivate-user",
  authenticateToken,
  UserComponent.deactivateUser
);
router.post("/logout", authenticateToken, UserComponent.userLogout);

export default router;
