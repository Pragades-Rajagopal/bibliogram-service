import { hash, genSalt, compare } from "bcrypt";
import { randomBytes } from "crypto";
import appDB from "../connector/database";
import constants from "../config/constants";
const salt = 10;

/**
 * Generates a private key and hashes it
 * @returns {*} result
 */
export const generatePrivateKey = async () => {
  try {
    const privateKey = randomBytes(24).toString("hex");
    const _genSalt = await genSalt(salt);
    const hashedPkey = await hash(privateKey, _genSalt);
    console.log(constants.loginService.hash.success);
    return {
      privateKey: privateKey,
      hashedPKey: hashedPkey,
    };
  } catch (error: any) {
    console.error(constants.loginService.hash.success);
    console.error(error);
    return {
      privateKey: null,
      hashedPKey: null,
    };
  }
};

/**
 * Verify the private key upon user login
 * @param {string} username
 * @param {string} privateKey
 * @returns {Promise} boolean | number
 */
export const verifyCredential = async (
  username: string,
  privateKey: string
): Promise<boolean | number> => {
  try {
    const data = await getPrivateKey(username);
    if (!data || data?.length === 0) {
      console.log(constants.user.notRegistered);
      return constants.statusCode.notFound;
    }
    const result = await compare(privateKey, data[0]["private_key"]);
    if (result) {
      console.log(constants.loginService.verification.success);
    }
    return result;
  } catch (error: any) {
    console.error(constants.loginService.verification.error);
    console.error(error);
    return false;
  }
};

/**
 * Models
 */

/**
 * Gets encrypted private key for an username
 * @param {string} username
 * @returns {Promise}
 */
const getPrivateKey = (username: string): Promise<any> => {
  const sql = `SELECT private_key FROM users WHERE username=? AND _status=1`;
  return new Promise((resolve, reject) => {
    appDB.all(sql, [username], (err, data) => {
      if (err) {
        reject("error at loginService/getPrivateKey method");
      } else {
        resolve(data);
      }
    });
  });
};
