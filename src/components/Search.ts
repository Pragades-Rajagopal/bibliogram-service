import { Request, Response } from "express";
import appDB from "../connector/database";
import constants from "../config/constants";

/**
 * Search controller
 * @param {Request} request
 * @param {Response} response
 * @returns {Promise<Response>}
 */
export const globalSearch = async (
  request: Request,
  response: Response
): Promise<Response> => {
  try {
    const { value } = request.query;
    console.log(`Searching for... ${value}`);
    const data = await searchModel(value as string);
    return response.status(constants.statusCode.success).json({
      statusCode: constants.statusCode.success,
      message: constants.bookNote.found,
      count: data.length,
      data: data,
    });
  } catch (error) {
    console.error(constants.search.error);
    console.error(error);
    return response.status(constants.statusCode.serverError).json({
      statusCode: constants.statusCode.serverError,
      message: constants.search.error,
    });
  }
};

/**
 * Models
 */

/**
 * Search model which retrieves data from notes view and books
 * @param {string} value
 * @returns {Promise<any>}
 */
const searchModel = (value: string): Promise<any> => {
  const sql = `
    SELECT
        'book' as "type",
        name as "field1",
        '' as "field2",
        '' as "field3",
        author as "field4",
        '' as "field5"
    FROM
        books
    WHERE
        LOWER(name) like '%${value}%'
        or LOWER(author) like '%${value}%'
    UNION
    SELECT
        'note' as "type",
        notes as "field1",
        user as "field2",
        book_name as "field3",
        author as "field4",
        short_date as "field5"
    FROM
        book_notes_vw
    WHERE
        LOWER(notes) like '%${value}%'
    `;
  return new Promise((resolve, reject): any => {
    appDB.all(sql, [], (err, data) => {
      if (err) {
        reject("Error at searchModel method");
      } else {
        resolve(data);
      }
    });
  });
};
