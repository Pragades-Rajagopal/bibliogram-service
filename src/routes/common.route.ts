import { Router } from "express";
const router = Router();
// Components
import * as UserComponent from "../components/User";
import * as BookComponent from "../components/Book";
// Validations
import * as userValidations from "../validators/user";
import * as bookValidations from "../validators/book";

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

/**
 * Book routes
 */
router.post(
  "/books",
  authenticateToken,
  bookValidations.addBooksValidation,
  BookComponent.bulkAddBooks
);
router.get("/books/:id", authenticateToken, BookComponent.getBookById);
router.get("/books", authenticateToken, BookComponent.getAllBooks);
router.delete(
  "/books",
  authenticateToken,
  bookValidations.deleteBooksValidation,
  BookComponent.deleteBooks
);

export default router;
