import { Request, Response } from "express";
import moment from "moment";
import appDB from "../connector/database";
import constants from "../config/constants";
import { BookNote } from "../models/book";

/**
 * Adds or updates note
 * @param {Request} request
 * @param {Response} response
 * @returns {Promise<Response>}
 */
export const upsertNote = async (
  request: Request,
  response: Response
): Promise<Response> => {
  try {
    const body: BookNote = request.body;
    // update note if it already exists
    if (body && body.id) {
      const isNoteExists: [] = await getNoteModel(body.id.toString());
      if (isNoteExists && isNoteExists.length > 0) {
        await updateNote(body);
        return response.status(constants.statusCode.success).json({
          statusCode: constants.statusCode.success,
          message: constants.bookNote.updateSuccess,
        });
      }
    }
    // else add note
    await addNoteModel(body);
    return response.status(constants.statusCode.success).json({
      statusCode: constants.statusCode.success,
      message: constants.bookNote.addSuccess,
    });
  } catch (error) {
    console.error(constants.bookNote.addOrUpdateFailure);
    console.error(error);
    return response.status(constants.statusCode.serverError).json({
      statusCode: constants.statusCode.serverError,
      message: constants.bookNote.addOrUpdateFailure,
    });
  }
};

/**
 * Gets a book note based on note id
 * @param {Request} request
 * @param {Response} response
 * @returns {Promise<Response>}
 */
export const getNote = async (
  request: Request,
  response: Response
): Promise<Response> => {
  try {
    const id = request.params.id;
    const data: [] = await getNoteModel(id);
    if (data && data.length === 0) {
      return response.status(constants.statusCode.notFound).json({
        statusCode: constants.statusCode.notFound,
        message: constants.bookNote.notFound,
        data: [],
      });
    }
    return response.status(constants.statusCode.success).json({
      statusCode: constants.statusCode.success,
      message: constants.bookNote.found,
      data: data,
    });
  } catch (error) {
    console.error(constants.bookNote.getError);
    console.error(error);
    return response.status(constants.statusCode.serverError).json({
      statusCode: constants.statusCode.serverError,
      message: constants.bookNote.getError,
    });
  }
};

/**
 * Gets book notes with query
 *
 * * Filter with `book id` or `user id` or both
 * * Paginate with `limit` and `offset`
 * @param {Request} request
 * @param {Response} response
 * @returns {Promise<Response>}
 */
export const getNotesByQuery = async (
  request: Request,
  response: Response
): Promise<Response> => {
  try {
    const { bookId, userId, limit, offset } = request.query;
    const data: [] = await getNoteModel(
      undefined,
      bookId as string,
      userId as string,
      limit as string,
      offset as string
    );
    if (data && data.length === 0) {
      return response.status(constants.statusCode.notFound).json({
        statusCode: constants.statusCode.notFound,
        message: constants.bookNote.notFound,
        count: 0,
        data: [],
      });
    }
    return response.status(constants.statusCode.success).json({
      statusCode: constants.statusCode.success,
      message: constants.bookNote.found,
      count: data.length,
      data: data,
    });
  } catch (error) {
    console.error(constants.bookNote.getError);
    console.error(error);
    return response.status(constants.statusCode.serverError).json({
      statusCode: constants.statusCode.serverError,
      message: constants.bookNote.getError,
    });
  }
};

/**
 * Deletes note
 * @param {Request} request
 * @param {Response} response
 * @returns {Promise<Response>}
 */
export const deleteNote = async (
  request: Request,
  response: Response
): Promise<Response> => {
  try {
    const { id } = request.params;
    await deleteNoteModel(id);
    return response.status(constants.statusCode.success).json({
      statusCode: constants.statusCode.success,
      message: constants.bookNote.deleteSuccess,
    });
  } catch (error) {
    console.error(constants.bookNote.deleteFailure);
    console.error(error);
    return response.status(constants.statusCode.serverError).json({
      statusCode: constants.statusCode.serverError,
      message: constants.bookNote.deleteFailure,
    });
  }
};

export const updateNoteVisibility = async (
  request: Request,
  response: Response
): Promise<Response> => {
  try {
    const { id, flag } = request.params;
    if (
      flag !== constants.bookNote.publicFlag &&
      flag !== constants.bookNote.privateFlag
    ) {
      return response.status(constants.statusCode.error).json({
        statusCode: constants.statusCode.error,
        message: constants.bookNote.badRequest,
      });
    }
    await updateNoteVisibilityModel(id, flag);
    return response.status(constants.statusCode.success).json({
      statusCode: constants.statusCode.success,
      message: constants.bookNote.updateFlagSuccess,
    });
  } catch (error) {
    console.error(constants.bookNote.updateFlagFailure);
    console.error(error);
    return response.status(constants.statusCode.serverError).json({
      statusCode: constants.statusCode.serverError,
      message: constants.bookNote.updateFlagFailure,
    });
  }
};

/**
 * Models
 */

/**
 * Add note for the given `book_id`
 * @param {BookNote} data
 * @returns {Promise}
 */
const addNoteModel = (data: BookNote): Promise<any> => {
  const currentTime = moment()
    .utcOffset("+05:30")
    .format("YYYY-MM-DD HH:mm:ss");
  const sql = `
    INSERT INTO book_notes (user_id, book_id, notes,
    created_on, modified_on) VALUES (?,?,?,?,?)
  `;
  return new Promise((resolve, reject): any => {
    appDB.run(
      sql,
      [data.userId, data.bookId, data.note, currentTime, currentTime],
      (err) => {
        if (err) {
          console.error(err);

          reject("error at addNoteModel method");
        } else {
          resolve("success");
        }
      }
    );
  });
};

/**
 * Updates note
 * @param {BookNote} data
 * @returns {Promise}
 */
const updateNote = (data: BookNote): Promise<any> => {
  const currentTime = moment()
    .utcOffset("+05:30")
    .format("YYYY-MM-DD HH:mm:ss");
  const sql = `
    UPDATE book_notes
    SET notes=?, modified_on=?
    WHERE user_id=? 
    AND book_id=?
    AND id=?
  `;
  return new Promise((resolve, reject): any => {
    appDB.run(
      sql,
      [data.note, currentTime, data.userId, data.bookId, data.id],
      (err) => {
        if (err) {
          reject("error at updateNote method");
        } else {
          resolve("success");
        }
      }
    );
  });
};

/**
 * Gets the book note
 *
 * * Fetch a note with `note id`
 * * Filter with `book id` or `user id` or both
 * * Paginate with `limit` and `offset`
 * @param {string} noteId
 * @param {string} bookId
 * @param {string} userId
 * @param {string} limit
 * @param {string} offset
 * @returns {Promise}
 */
const getNoteModel = (
  noteId?: string,
  bookId?: string,
  userId?: string,
  limit?: string,
  offset?: string
): Promise<any> => {
  // For global notes
  let sql: string =
    userId || bookId || noteId
      ? `SELECT * FROM book_notes_vw`
      : `SELECT * FROM book_notes_vw WHERE is_private=0`;
  if (noteId) {
    // Get note by id
    sql = sql + ` WHERE id=${noteId}`;
  }
  if (bookId && userId) {
    sql =
      sql + ` WHERE book_id=${bookId} AND user_id=${userId} AND is_private=0`;
  } else if (bookId) {
    // Get all public notes for the given book
    sql = sql + ` WHERE book_id=${bookId} AND is_private=0`;
  } else if (userId) {
    // Get all notes for the given user
    sql = sql + ` WHERE user_id=${userId}`;
  }
  sql = sql + ` ORDER BY modified_on DESC`;
  if (limit) {
    sql = sql + ` LIMIT ${limit}`;
  }
  if (offset) {
    sql = sql + ` OFFSET ${offset}`;
  }
  return new Promise((resolve, reject): any => {
    console.log(`sql > ${sql}`);
    appDB.all(sql, [], (err, data) => {
      if (err) {
        reject("Error at getNoteModel method");
      } else {
        resolve(data);
      }
    });
  });
};

/**
 * Deletes a note
 * @param {string} id
 * @returns {Promise}
 */
const deleteNoteModel = (id: string): Promise<any> => {
  const sql = `DELETE FROM book_notes WHERE id=?`;
  return new Promise((resolve, reject): any => {
    appDB.run(sql, [id], (err) => {
      if (err) {
        reject("Error at deleteNote method");
      } else {
        resolve("success");
      }
    });
  });
};

/**
 * Update the note visibility
 * @param {string} id
 * @param {string} flag 'public' | 'private'
 * @returns {Promise}
 */
const updateNoteVisibilityModel = (id: string, flag: string): Promise<any> => {
  const currentTime = moment()
    .utcOffset("+05:30")
    .format("YYYY-MM-DD HH:mm:ss");
  let sql;
  if (flag === constants.bookNote.publicFlag) {
    sql = `UPDATE book_notes SET is_private=0, modified_on=? WHERE id=?`;
  } else {
    sql = `UPDATE book_notes SET is_private=1, modified_on=? WHERE id=?`;
  }
  return new Promise((resolve, reject): any => {
    appDB.run(sql, [currentTime, id], (err) => {
      if (err) {
        reject("Error at updateNoteVisibilityModel method");
      } else {
        resolve("success");
      }
    });
  });
};
