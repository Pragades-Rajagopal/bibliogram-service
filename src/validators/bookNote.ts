import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import constants from "../config/constants";

export const addOrUpdateValidation = [
  body("note").exists().not().isEmpty().withMessage("note is mandatory"),
  body("userId").exists().not().isEmpty().withMessage("userId is mandatory"),
  body("bookId").exists().not().isEmpty().withMessage("bookId is mandatory"),
  body("noteId").optional(),
  (request: Request, response: Response, next: NextFunction) => {
    const validationError = validationResult(request);
    if (!validationError.isEmpty()) {
      return response.status(constants.statusCode.error).json({
        statusCode: constants.statusCode.error,
        message: validationError.mapped(),
        error: constants.commonServerError.badRequest,
      });
    }
    next();
  },
];
