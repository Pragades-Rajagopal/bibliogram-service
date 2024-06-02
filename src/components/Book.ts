import { Request, Response } from "express";
import moment from "moment";
import appDB from "../connector/database";
import { Book } from "../models/book";
import constants from "../config/constants";

/**
 * Add books in bulk
 *
 * Will be called from the model daily to load new books
 * @param {Request} request
 * @param {Reponse} response
 * @returns {Promise<Response>}
 */
export const bulkAddBooks = async (
  request: Request,
  response: Response
): Promise<Response> => {
  try {
    const { data } = request.body;
    await bulkInsertBookModel(data);
    return response.status(constants.statusCode.success).json({
      statusCode: constants.statusCode.success,
      message: constants.books.addSuccess,
    });
  } catch (error) {
    console.error(constants.books.addFailure);
    console.error(error);
    return response.status(constants.statusCode.serverError).json({
      statusCode: constants.statusCode.serverError,
      message: constants.books.addFailure,
    });
  }
};

/**
 * Get book detail by book id
 * @param {Request} request
 * @param {Response} response
 * @returns {Promise<Response>}
 */
export const getBookById = async (
  request: Request,
  response: Response
): Promise<Response> => {
  try {
    const bookId = request.params.id;
    const result: [] = await getBook(bookId);
    if (result && result.length === 0) {
      return response.status(constants.statusCode.notFound).json({
        statusCode: constants.statusCode.notFound,
        message: constants.books.notFound,
        data: [],
      });
    }
    return response.status(constants.statusCode.success).json({
      statusCode: constants.statusCode.success,
      message: constants.books.found,
      data: result,
    });
  } catch (error) {
    console.error(constants.books.getError);
    console.error(error);
    return response.status(constants.statusCode.serverError).json({
      statusCode: constants.statusCode.serverError,
      message: constants.books.getError,
    });
  }
};

/**
 * Get all book details
 *
 * * Filter the result using book `name` and `author`
 * * Paginate the result with `limit` and `offset`
 * @param {Request} request
 * @param {Response} response
 * @returns {Promise<Response>}
 */
export const getAllBooks = async (
  request: Request,
  response: Response
): Promise<Response> => {
  try {
    const { name, author, limit, offset } = request.query;
    let query = {} as any;
    if (name) {
      query.name = name;
    }
    if (author) {
      query.author = author;
    }
    const result: [] = await getAllBooksModel(
      query,
      limit as string,
      offset as string
    );
    if (result && result.length === 0) {
      return response.status(constants.statusCode.notFound).json({
        statusCode: constants.statusCode.notFound,
        message: constants.books.notFound,
        count: 0,
        data: [],
      });
    }
    return response.status(constants.statusCode.success).json({
      statusCode: constants.statusCode.success,
      message: constants.books.found,
      count: result.length,
      data: result,
    });
  } catch (error) {
    console.error(constants.books.getError);
    console.error(error);
    return response.status(constants.statusCode.serverError).json({
      statusCode: constants.statusCode.serverError,
      message: constants.books.getError,
    });
  }
};

export const getTopBooks = async (
  request: Request,
  response: Response
): Promise<Response> => {
  try {
    const result = await getTopBooksModel();
    return response.status(constants.statusCode.success).json({
      statusCode: constants.statusCode.success,
      message: constants.books.found,
      count: result.length,
      data: result,
    });
  } catch (error) {
    console.error(constants.books.getTopBooksError);
    console.error(error);
    return response.status(constants.statusCode.serverError).json({
      statusCode: constants.statusCode.serverError,
      message: constants.books.getTopBooksError,
    });
  }
};

/**
 * Deletes books in bulk
 * @param {Request} request
 * @param {Response} response
 * @returns {Promise<Response>}
 */
export const deleteBooks = async (
  request: Request,
  response: Response
): Promise<Response> => {
  try {
    const { bookIds } = request.body;
    await deleteBookModel(bookIds);
    return response.status(constants.statusCode.success).json({
      statusCode: constants.statusCode.success,
      message: constants.books.deleteSuccess,
    });
  } catch (error) {
    console.error(constants.books.deleteError);
    console.error(error);
    return response.status(constants.statusCode.serverError).json({
      statusCode: constants.statusCode.serverError,
      message: constants.books.deleteError,
    });
  }
};

/**
 * Models
 */

/**
 * Adds book data with bulk load
 * @param {Book[]} books
 * @returns {Promise}
 */
const bulkInsertBookModel = (books: Book[]): Promise<any> => {
  const currentTime = moment()
    .utcOffset("+05:30")
    .format("YYYY-MM-DD HH:mm:ss");
  const sql = `
        INSERT INTO books (name, author, summary, rating,
        pages, published_on, _created_on) VALUES (?,?,?,?,?,?,?)
    `;
  return new Promise((resolve, reject): any => {
    for (const book of books) {
      appDB.run(
        sql,
        [
          book.name,
          book.author,
          book?.summary ? book?.summary : null,
          book?.rating ? book?.rating : null,
          book?.pages ? book.pages : null,
          book?.published_on ? book.published_on : null,
          currentTime,
        ],
        (err) => {
          if (err) {
            console.log(err);
            reject("error at bulkInsertBookModel method");
          } else {
            resolve("book added successfully");
          }
        }
      );
    }
  });
};

/**
 * Get a book detail
 * @param {string} id
 * @returns {Promise}
 */
const getBook = (id: string): Promise<any> => {
  const sql = `SELECT * FROM books WHERE id=?`;
  return new Promise((resolve, reject): any => {
    appDB.all(sql, [id], (err, data) => {
      if (err) {
        reject("error at getBook method");
      } else {
        resolve(data);
      }
    });
  });
};

/**
 * Get all books
 *
 * * query with `name` or `author` or both
 * * paginate the result with `limit` and `offset`
 * @param {object} query
 * @param {string} limit
 * @param {string} offset
 * @returns {Promise}
 */
const getAllBooksModel = (
  query: Book,
  limit: string | undefined,
  offset?: string | undefined
): Promise<any> => {
  let sql = `SELECT * FROM books`;
  if (query.name && query.author) {
    sql =
      sql +
      ` WHERE name LIKE '%${query.name}%' and author LIKE '%${query.author}%'`;
  } else if (query.name) {
    sql = sql + ` WHERE name LIKE '%${query.name}%'`;
  } else if (query.author) {
    sql = sql + ` WHERE author LIKE '%${query.author}%'`;
  }
  sql = sql + " ORDER BY id DESC ";
  if (limit) {
    sql = sql + ` LIMIT ${limit}`;
  }
  if (offset) {
    sql = sql + ` OFFSET ${offset}`;
  }
  return new Promise((resolve, reject): any => {
    appDB.all(sql, [], (err, data) => {
      console.log(`sql > ${sql}`);
      if (err) {
        console.log(err);
        reject("error at getAllBooksModel method");
      } else {
        resolve(data);
      }
    });
  });
};

/**
 * Gets top books having number of notes
 * @returns {Promise}
 */
const getTopBooksModel = (): Promise<any> => {
  const sql = `
    SELECT
      b.*,
      (
      SELECT
        COUNT(1)
      FROM
        book_notes bn
      WHERE
        bn.book_id = b.id) AS notes_count
    FROM
      books b
    WHERE
      notes_count > 0
    ORDER BY
      notes_count DESC,
      name ASC 
    LIMIT 50 
  `;
  return new Promise((resolve, reject): any => {
    appDB.all(sql, [], (err, data) => {
      if (err) {
        reject("error at getTopBooksModel method");
      } else {
        resolve(data);
      }
    });
  });
};

/**
 * Deletes books in bulk
 * @param {string[]}ids
 * @returns {Promise}
 */
const deleteBookModel = (ids: string[]): Promise<any> => {
  const sql = `DELETE FROM books WHERE id=?`;
  return new Promise((resolve, reject): any => {
    for (const id of ids) {
      appDB.run(sql, [id], (err) => {
        if (err) {
          reject("error at deleteBookModel method");
        } else {
          resolve("success");
        }
      });
    }
  });
};
