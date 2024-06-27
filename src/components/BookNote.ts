import { Request, Response } from "express";
import moment from "moment";
import appDB from "../connector/database";
import constants from "../config/constants";
import { BookNote, SaveNote } from "../models/book";
import {
  isBookExists,
  isBookNoteExists,
  isUserExists,
} from "../services/asset.validation";

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
    // asset validation
    const _isBookExists: [] = await isBookExists(body.bookId);
    const _isUserExists: [] = await isUserExists(body.userId);
    if (_isBookExists.length === 0 || _isUserExists.length === 0) {
      return response.status(constants.statusCode.error).json({
        statusCode: constants.statusCode.error,
        message: `${constants.assetValidation.userNotExists} or ${constants.assetValidation.bookNotExists}`,
      });
    }
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
    // asset validation
    const _isBookNoteExists: [] = await isBookNoteExists(parseInt(id, 10));
    if (_isBookNoteExists.length === 0) {
      return response.status(constants.statusCode.error).json({
        statusCode: constants.statusCode.error,
        message: constants.assetValidation.bookNoteNotExists,
      });
    }
    await deleteNoteModel(id);
    await deleteCommentsUponDeleteNote(id);
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
    // asset validation
    const _isBookNoteExists: [] = await isBookNoteExists(parseInt(id, 10));
    if (_isBookNoteExists.length === 0) {
      return response.status(constants.statusCode.error).json({
        statusCode: constants.statusCode.error,
        message: constants.assetValidation.bookNoteNotExists,
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
 * Adds or updates note
 * @param {Request} request
 * @param {Response} response
 * @returns {Promise<Response>}
 */
export const saveNoteForLater = async (
  request: Request,
  response: Response
): Promise<Response> => {
  try {
    const body: SaveNote = request.body;
    // asset validation
    const _isBookNoteExists: [] = await isBookNoteExists(body.noteId);
    const _isUserExists: [] = await isUserExists(body.userId);
    if (_isBookNoteExists.length === 0 || _isUserExists.length === 0) {
      return response.status(constants.statusCode.error).json({
        statusCode: constants.statusCode.error,
        message: `${constants.assetValidation.userNotExists} or ${constants.assetValidation.bookNoteNotExists}`,
      });
    }
    await saveNoteForLaterModel(body);
    return response.status(constants.statusCode.success).json({
      statusCode: constants.statusCode.success,
      message: constants.saveNoteForLater.addSuccess,
    });
  } catch (error: any) {
    console.error(constants.saveNoteForLater.addFailure);
    console.error(error);
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
        error: constants.saveNoteForLater.addFailure,
        code: null,
      });
    }
  }
};

export const getSavedNotesForLater = async (
  request: Request,
  response: Response
): Promise<Response> => {
  try {
    const userId = request.params.id;
    const data = await getSavedNotesForLaterModel(parseInt(userId, 10));
    if (data && data.length === 0) {
      return response.status(constants.statusCode.notFound).json({
        statusCode: constants.statusCode.notFound,
        message: constants.saveNoteForLater.notFound,
        count: 0,
        data: [],
      });
    }
    return response.status(constants.statusCode.success).json({
      statusCode: constants.statusCode.success,
      message: constants.saveNoteForLater.found,
      count: data.length,
      data: data,
    });
  } catch (error) {
    console.error(constants.saveNoteForLater.getError);
    console.error(error);
    return response.status(constants.statusCode.serverError).json({
      statusCode: constants.statusCode.serverError,
      message: constants.saveNoteForLater.getError,
    });
  }
};

/**
 * Deletes saved note for later
 * @param {Request} request
 * @param {Response} response
 * @returns {Promise<Response>}
 */
export const deleteSavedNoteForLater = async (
  request: Request,
  response: Response
): Promise<Response> => {
  try {
    const { noteId, userId } = request.params;
    // asset validation
    const _isBookNoteExists: [] = await isBookNoteExists(parseInt(noteId, 10));
    const _isUserExists: [] = await isUserExists(parseInt(userId, 10));
    if (_isBookNoteExists.length === 0 || _isUserExists.length === 0) {
      return response.status(constants.statusCode.error).json({
        statusCode: constants.statusCode.error,
        message: `${constants.assetValidation.userNotExists} or ${constants.assetValidation.bookNoteNotExists}`,
      });
    }
    await deleteSavedNotesForLaterModel(noteId, userId);
    return response.status(constants.statusCode.success).json({
      statusCode: constants.statusCode.success,
      message: constants.saveNoteForLater.deleteSuccess,
    });
  } catch (error) {
    console.error(constants.saveNoteForLater.deleteError);
    console.error(error);
    return response.status(constants.statusCode.serverError).json({
      statusCode: constants.statusCode.serverError,
      message: constants.saveNoteForLater.deleteError,
    });
  }
};

export const isNoteSavedForLater = async (
  request: Request,
  response: Response
): Promise<Response> => {
  try {
    const { noteId, userId } = request.params;
    const data: [] = await isNoteSavedForLaterModel(noteId, userId);
    if (data && data.length === 0) {
      return response.status(constants.statusCode.notFound).json({
        statusCode: constants.statusCode.notFound,
        message: constants.saveNoteForLater.notFound,
        value: 0,
      });
    }
    return response.status(constants.statusCode.success).json({
      statusCode: constants.statusCode.success,
      message: constants.saveNoteForLater.found,
      value: 1,
    });
  } catch (error) {
    console.error(constants.saveNoteForLater.getError);
    console.error(error);
    return response.status(constants.statusCode.serverError).json({
      statusCode: constants.statusCode.serverError,
      message: constants.saveNoteForLater.getError,
      value: null,
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
    created_on, modified_on, is_private) VALUES (?,?,?,?,?,?)
  `;
  return new Promise((resolve, reject): any => {
    appDB.run(
      sql,
      [
        data.userId,
        data.bookId,
        data.note,
        currentTime,
        currentTime,
        data.isPrivate,
      ],
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
    SET notes=?, modified_on=?, is_private=?
    WHERE user_id=? 
    AND book_id=?
    AND id=?
  `;
  return new Promise((resolve, reject): any => {
    appDB.run(
      sql,
      [
        data.note,
        currentTime,
        data.isPrivate,
        data.userId,
        data.bookId,
        data.id,
      ],
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
 * Deletes a comment
 * @param {string} noteId
 * @returns {Promise}
 */
const deleteCommentsUponDeleteNote = (noteId: string): Promise<any> => {
  const sql = `DELETE FROM comments WHERE note_id=?`;
  return new Promise((resolve, reject): any => {
    appDB.run(sql, [noteId], (err) => {
      if (err) {
        reject("Error at deleteCommentsUponDeleteNote method");
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

/**
 * Save note for later
 * @param {SaveNote} data
 * @returns {Promise}
 */
const saveNoteForLaterModel = (data: SaveNote): Promise<any> => {
  const sql = `
    INSERT INTO saved_notes (user_id, note_id) VALUES (?,?)
  `;
  return new Promise((resolve, reject): any => {
    appDB.run(sql, [data.userId, data.noteId], (err) => {
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
    });
  });
};

/**
 * Get saved notes for later
 * @param {number} userId
 * @returns {Promise<any>}
 */
const getSavedNotesForLaterModel = (userId: number): Promise<any> => {
  const sql = `
    SELECT
      bnv.*
    FROM
      book_notes_vw bnv,
      saved_notes s
    WHERE
      BNV.id = s.note_id
      AND s.user_id=?
  `;
  return new Promise((resolve, reject): any => {
    appDB.all(sql, [userId], (err, data) => {
      if (err) {
        reject("Error at getSavedNotesForLaterModel method");
      } else {
        resolve(data);
      }
    });
  });
};

/**
 * Deletes saved notes for later
 * @param {string} noteId
 * @param {string} userId
 * @returns {Promise}
 */
const deleteSavedNotesForLaterModel = (
  noteId: string,
  userId: string
): Promise<any> => {
  const sql = `DELETE FROM saved_notes WHERE note_id=? AND user_id=?`;
  return new Promise((resolve, reject): any => {
    appDB.run(sql, [noteId, userId], (err) => {
      if (err) {
        reject("Error at deleteSavedNotesForLaterModel method");
      } else {
        resolve("success");
      }
    });
  });
};

/**
 * Retrieves value if the note was saved for later
 * @param {string} noteId
 * @param {string} userId
 * @returns {Promise}
 */
const isNoteSavedForLaterModel = (
  noteId: string,
  userId: string
): Promise<any> => {
  const sql = `SELECT 1 as value FROM saved_notes WHERE note_id=? AND user_id=?`;
  return new Promise((resolve, reject): any => {
    appDB.all(sql, [noteId, userId], (err, data) => {
      if (err) {
        console.log(err);
        reject("Error at isNoteSavedForLater method");
      } else {
        resolve(data);
      }
    });
  });
};
