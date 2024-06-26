import { Request, Response } from "express";
import appDB from "../connector/database";
import moment from "moment";
import * as userModel from "../models/user";
import constants from "../config/constants";
import * as loginService from "../services/login";
import * as middleware from "../services/middleware";
import { GeneratePrivateKey } from "../models/user";
import { isUserExists } from "../services/asset.validation";

/**
 * Saves user into the system upon registration
 * @param {Request} request
 * @param {Response} response
 * @returns {Promise<Response>} endpoint response
 */
export const registerUser = async (
  request: Request,
  response: Response
): Promise<Response> => {
  try {
    let body = request.body;
    const pKeyResult: GeneratePrivateKey =
      await loginService.generatePrivateKey();
    body = { ...body, privateKey: pKeyResult["hashedPKey"] };
    await saveUserModel(body);
    return response.status(constants.statusCode.success).json({
      statusCode: constants.statusCode.success,
      message: constants.user.registered,
      error: null,
      privateKey: pKeyResult["privateKey"],
    });
  } catch (error: any) {
    if (error.code === constants.databaseErrors.constraint) {
      return response.status(constants.statusCode.error).json({
        statusCode: constants.statusCode.error,
        message: error.message,
        error: constants.commonServerError.badRequest,
        code: error.code,
      });
    } else {
      return response.status(constants.statusCode.serverError).json({
        statusCode: constants.statusCode.serverError,
        message: error.message,
        error: constants.commonServerError.internal,
        code: null,
      });
    }
  }
};

/**
 * User login component
 * @param {Request} request
 * @param {Response} response
 * @returns {Promise}
 */
export const userLogin = async (
  request: Request,
  response: Response
): Promise<Response> => {
  try {
    const { username, privateKey } = request.body;
    const verifyUser = await loginService.verifyCredential(
      username,
      privateKey
    );
    if (verifyUser === constants.statusCode.notFound) {
      return response.status(constants.statusCode.notFound).json({
        statusCode: constants.statusCode.notFound,
        message: constants.user.notRegistered,
        token: "",
      });
    } else if (!verifyUser) {
      return response.status(constants.statusCode.unauthorized).json({
        statusCode: constants.statusCode.unauthorized,
        message: constants.user.invalidAuth,
        token: "",
      });
    }
    const userInfo = await getUserInfo(username);
    // Generates JWT and saves in database
    const token = middleware.generateToken(userInfo[0]);
    await deleteUserLogin(username);
    await saveUserLogin(username, token);
    return response.status(constants.statusCode.success).json({
      statusCode: constants.statusCode.success,
      message: "success",
      token: token,
    });
  } catch (error: any) {
    return response.status(constants.statusCode.serverError).json({
      statusCode: constants.statusCode.serverError,
      message: null,
      error: error.message,
    });
  }
};

/**
 * User logout component
 * @param {Request} request
 * @param {Response} response
 * @returns {Promise}
 */
export const userLogout = async (
  request: Request,
  response: Response
): Promise<Response> => {
  try {
    const username = request.body.username;
    const isUserLoggedIn = await getUserLoginInfo(username);
    if (isUserLoggedIn && isUserLoggedIn.length === 0) {
      return response.status(constants.statusCode.error).json({
        statusCode: constants.statusCode.error,
        message: constants.user.loginNotFound,
      });
    }
    await saveUserLogout(username);
    return response.status(constants.statusCode.success).json({
      statusCode: constants.statusCode.success,
      message: constants.user.logoutSuccess,
    });
  } catch (error: any) {
    return response.status(constants.statusCode.serverError).json({
      statusCode: constants.statusCode.serverError,
      message: null,
      error: error.message,
    });
  }
};

export const deactivateUser = async (
  request: Request | any,
  response: Response
): Promise<Response> => {
  try {
    const tokenData = request["user"];
    const { userId } = request.body;
    // asset validation
    const _isUserExists: [] = await isUserExists(userId);
    if (_isUserExists.length === 0) {
      return response.status(constants.statusCode.error).json({
        statusCode: constants.statusCode.error,
        message: constants.assetValidation.userNotExists,
      });
    }
    if (tokenData["id"] != userId) {
      return response.status(constants.statusCode.unauthorized).json({
        statusCode: constants.statusCode.unauthorized,
        message: constants.commonServerError.forbidden,
      });
    }
    await Promise.all([
      deleteCommentsOfUser(userId),
      deleteBookNotesOfUser(userId),
      deactivateUserModel(userId),
      deleteUser(userId),
    ]);
    return response.status(constants.statusCode.success).json({
      statusCode: constants.statusCode.success,
      message: constants.user.deactivationSuccess,
    });
  } catch (error: any) {
    console.error(constants.user.deactivationError);
    console.error(error);
    return response.status(constants.statusCode.serverError).json({
      statusCode: constants.statusCode.serverError,
      message: constants.user.deactivationError,
    });
  }
};

/**
 * Models
 */

/**
 * Saves user upon registration
 * @param {userModel.ISaveUserRequest} data
 * @returns {Promise}
 */
const saveUserModel = (data: userModel.ISaveUserRequest): Promise<any> => {
  const currentTime = moment()
    .utcOffset("+05:30")
    .format("YYYY-MM-DD HH:mm:ss");
  const status = 1;
  const sql = `
    INSERT INTO users (fullname, username, private_key, _status, created_on)
    VALUES (?,?,?,?,?)
  `;
  return new Promise((resolve, reject) => {
    appDB.run(
      sql,
      [data.fullname, data.username, data.privateKey, status, currentTime],
      (err: any) => {
        if (err) {
          console.error("error while saving the user");
          console.error(err.message);
          const message =
            err.message.split(": ")[0] === constants.databaseErrors.constraint
              ? err.message.split("SQLITE_CONSTRAINT: ")[1]
              : err.message.split(": ")[1];
          const code = err.message.split(": ")[0];
          reject({
            flag: false,
            message: message,
            code: code,
          });
        } else {
          resolve({
            flag: true,
            message: null,
            code: null,
          });
        }
      }
    );
  });
};

/**
 * Gets necessary user info for token payload
 * @param {string} username
 * @returns {Promise}
 */
const getUserInfo = (username: string): Promise<any> => {
  const sql = `
    SELECT id, username, fullname FROM users 
    WHERE username=? and _status=1
  `;
  return new Promise((resolve, reject) => {
    appDB.all(sql, [username], (err, data) => {
      if (err) {
        reject("error while getting user data: getUserInfo");
      } else {
        resolve(data);
      }
    });
  });
};

/**
 * Deletes previous user login info for an user
 * @param {string} username
 * @returns {Promise}
 */
const deleteUserLogin = (username: string): Promise<any> => {
  const sql = `
    DELETE FROM user_login WHERE username = ?
  `;
  return new Promise((resolve, reject) => {
    appDB.run(sql, [username], (err) => {
      if (err) {
        reject("error at deleteUserLogin method");
        console.log(err);
      } else {
        resolve("success");
      }
    });
  });
};

/**
 * Saves user login info after successful login
 * @param {string} username
 * @param {string} token
 * @returns null
 */
const saveUserLogin = (username: string, token: string): Promise<any> => {
  const currentTime = moment()
    .utcOffset("+05:30")
    .format("YYYY-MM-DD HH:mm:ss");
  const sql = `
      INSERT INTO user_login (username, token, logged_in)
      VALUES (?,?,?)
  `;
  return new Promise((resolve, reject) => {
    appDB.run(sql, [username, token, currentTime], (err) => {
      if (err) {
        reject("error at saveUserLogin method");
        console.log(err);
      } else {
        resolve("success");
      }
    });
  });
};

/**
 * Gets the user login info
 * @param {string} username
 * @returns {Promise}
 */
const getUserLoginInfo = (username: string): Promise<any> => {
  const sql = `SELECT * FROM user_login WHERE username=?`;
  return new Promise((resolve, reject) => {
    appDB.all(sql, [username], (err, data) => {
      if (err) {
        reject("error at getUserLoginInfo method");
      } else {
        resolve(data);
      }
    });
  });
};

/**
 * Updates logout time for logged out user
 * @param {string} username
 * @returns {Promise}
 */
const saveUserLogout = (username: string): Promise<any> => {
  const currentTime = moment()
    .utcOffset("+05:30")
    .format("YYYY-MM-DD HH:mm:ss");
  const sql = `
    UPDATE user_login
    SET logged_out=?
    WHERE username=?
  `;
  return new Promise((resolve, reject) => {
    appDB.run(sql, [currentTime, username], (err) => {
      if (err) {
        reject("error at saveUserLogout method");
      } else {
        resolve("success");
      }
    });
  });
};

/**
 * Save user info to deactivated user model upon deactivation
 * @param {string} userId
 * @returns {Promise}
 */
const deactivateUserModel = (userId: string): Promise<any> => {
  const sql = `
      INSERT INTO deactivated_users (
        uid, fullname, username, deactivated_on, usage_days
      ) SELECT id, fullname, username,
      DATETIME(CURRENT_TIMESTAMP, 'localtime') ,
      CAST(JULIANDAY(DATE('now')) - JULIANDAY(DATE("created_on")) AS INTEGER)
      FROM users u 
      WHERE u.id=?
  `;
  return new Promise((resolve, reject): any => {
    appDB.run(sql, [userId], (err) => {
      if (err) {
        console.log(err);
        reject("error at deactivateUserModel method");
      } else {
        resolve("success");
      }
    });
  });
};

/**
 * Deletes user upon deactivation
 * @param {string} userId
 * @returns {Promise}
 */
const deleteUser = (userId: number): Promise<any> => {
  const sql = `
    DELETE FROM users WHERE id = ?
  `;
  return new Promise((resolve, reject) => {
    appDB.run(sql, [userId], (err) => {
      if (err) {
        reject("error at deleteUser method");
        console.log(err);
      } else {
        resolve("success");
      }
    });
  });
};

/**
 * Deletes book notes upon user deactivation
 * @param {string} userId
 * @returns {Promise}
 */
const deleteBookNotesOfUser = (userId: number): Promise<any> => {
  const sql = `
    DELETE FROM book_notes WHERE user_id = ?
  `;
  return new Promise((resolve, reject) => {
    appDB.run(sql, [userId], (err) => {
      if (err) {
        reject("error at deleteBookNotesOfUser method");
        console.log(err);
      } else {
        resolve("success");
      }
    });
  });
};

/**
 * Deletes comments upon user deactivation
 * @param {string} userId
 * @returns {Promise}
 */
const deleteCommentsOfUser = (userId: number): Promise<any> => {
  const sql = `
    DELETE FROM comments WHERE user_id = ?
  `;
  return new Promise((resolve, reject) => {
    appDB.run(sql, [userId], (err) => {
      if (err) {
        reject("error at deleteCommentsOfUser method");
        console.log(err);
      } else {
        resolve("success");
      }
    });
  });
};
