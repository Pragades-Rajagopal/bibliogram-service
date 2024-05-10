import { Router } from "express";
const router = Router();
import * as UserComponent from "../components/user.component";
import * as userValidations from "../validators/user";
import { authenticateToken } from "../services/middleware";

/**
 * User routes
 */
router.post(
  "/register",
  userValidations.registerValidation,
  UserComponent.registerUser
);
router.post("/login", userValidations.loginValidation, UserComponent.userLogin);
router.post(
  "/deactivate-user",
  authenticateToken,
  userValidations.deactivateUserValidation,
  UserComponent.deactivateUser
);
router.post(
  "/logout",
  authenticateToken,
  userValidations.logoutValidation,
  UserComponent.userLogout
);

export default router;
