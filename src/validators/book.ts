import { body, check, validationResult } from "express-validator";
import { NextFunction, Request, Response } from "express";
import constants from "../config/constants";

export const addBooksValidation = [
  body("data").isArray(),
  body("data.*.name").exists().not().isEmpty().withMessage("name is mandatory"),
  body("data.*.author")
    .exists()
    .not()
    .isEmpty()
    .withMessage("author is mandatory"),
  (request: Request, response: Response, next: NextFunction): any => {
    const validationError = validationResult(request);
    if (!validationError.isEmpty()) {
      return response.status(constants.statusCode.error).json({
        statusCode: constants.statusCode.error,
        message: validationError.mapped(),
      });
    }
    next();
  },
];

export const deleteBooksValidation = [
  body("bookIds").isArray().exists().not().isEmpty().isNumeric(),
  (request: Request, response: Response, next: NextFunction): any => {
    const validationError = validationResult(request);
    if (!validationError.isEmpty()) {
      return response.status(constants.statusCode.error).json({
        statusCode: constants.statusCode.error,
        message: validationError.mapped(),
      });
    }
    next();
  },
];
