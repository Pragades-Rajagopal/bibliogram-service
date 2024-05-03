const path = require("path");
require("dotenv").config({
  path: path.resolve("./.env"),
});
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import constants from "../config/constants";

const secretKey: any = process.env.APP_ACCESS_TOKEN;

/**
 * Generates a JSON web token for the given user info
 * @param {object} payload username, fullname
 * @returns {string} token
 */
export const generateToken = (payload: object): string => {
  const accessToken = jwt.sign(payload, secretKey, {
    algorithm: "HS256",
  });
  return accessToken;
};

export const authenticateToken = (
  req: Request | any,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (typeof token === "undefined" || token === null) {
    return res.status(constants.statusCode.unauthorized).json({
      statusCode: constants.statusCode.unauthorized,
      message: constants.authenticationMessage.tokenMissing,
    });
  }
  jwt.verify(
    token,
    secretKey,
    { algorithms: ["HS256"] },
    (err: any, data: any) => {
      if (err) {
        return res.status(constants.statusCode.forbidden).json({
          statusCode: constants.statusCode.forbidden,
          message: constants.authenticationMessage.invalidToken,
        });
      }
      req.user = data;
      next();
    }
  );
};
