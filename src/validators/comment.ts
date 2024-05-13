import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import constants from "../config/constants";

export const addOrUpdateValidation = [
  body("comment").exists().not().isEmpty().withMessage("comment is mandatory"),
  body("userId").exists().not().isEmpty().withMessage("userId is mandatory"),
  body("noteId").exists().not().isEmpty().withMessage("noteId is mandatory"),
  body("commentId").optional(),
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
