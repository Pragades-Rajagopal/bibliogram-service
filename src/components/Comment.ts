import { Request, Response } from "express";
import moment from "moment";
import appDB from "../connector/database";
import constants from "../config/constants";
import { Comment } from "../models/book";

/**
 * Adds or updates comment to a note
 * @param {Request} request
 * @param {Response} response
 * @returns {Promise<Response>}
 */
export const upsertComment = async (
  request: Request,
  response: Response
): Promise<Response> => {
  try {
    const body: Comment = request.body;
    // update comment if it already exists
    if (body && body.id) {
      const isCommentExists: [] = await getCommentModel(body.id.toString());
      if (isCommentExists && isCommentExists.length > 0) {
        await updateComment(body);
        return response.status(constants.statusCode.success).json({
          statusCode: constants.statusCode.success,
          message: constants.comment.updateSuccess,
        });
      }
    }
    // else add comment
    await addCommentModel(body);
    return response.status(constants.statusCode.success).json({
      statusCode: constants.statusCode.success,
      message: constants.comment.addSuccess,
    });
  } catch (error) {
    console.error(constants.comment.addOrUpdateFailure);
    console.error(error);
    return response.status(constants.statusCode.serverError).json({
      statusCode: constants.statusCode.serverError,
      message: constants.comment.addOrUpdateFailure,
    });
  }
};

/**
 * Gets a comment based on comment id
 * @param {Request} request
 * @param {Response} response
 * @returns {Promise<Response>}
 */
export const getComment = async (
  request: Request,
  response: Response
): Promise<Response> => {
  try {
    const id = request.params.id;
    const data: [] = await getCommentModel(id);
    if (data && data.length === 0) {
      return response.status(constants.statusCode.notFound).json({
        statusCode: constants.statusCode.notFound,
        message: constants.comment.notFound,
        data: [],
      });
    }
    return response.status(constants.statusCode.success).json({
      statusCode: constants.statusCode.success,
      message: constants.comment.found,
      data: data,
    });
  } catch (error) {
    console.error(constants.comment.getError);
    console.error(error);
    return response.status(constants.statusCode.serverError).json({
      statusCode: constants.statusCode.serverError,
      message: constants.comment.getError,
    });
  }
};

/**
 * Gets comment with query
 *
 * * Filter with `note id` or `user id` or both
 * * Paginate with `limit` and `offset`
 * @param {Request} request
 * @param {Response} response
 * @returns {Promise<Response>}
 */
export const getCommentByQuery = async (
  request: Request,
  response: Response
): Promise<Response> => {
  try {
    const { noteId, userId, limit, offset } = request.query;
    const data: [] = await getCommentModel(
      undefined,
      noteId as string,
      userId as string,
      limit as string,
      offset as string
    );
    if (data && data.length === 0) {
      return response.status(constants.statusCode.notFound).json({
        statusCode: constants.statusCode.notFound,
        message: constants.comment.notFound,
        count: 0,
        data: [],
      });
    }
    return response.status(constants.statusCode.success).json({
      statusCode: constants.statusCode.success,
      message: constants.comment.found,
      count: data.length,
      data: data,
    });
  } catch (error) {
    console.error(constants.comment.getError);
    console.error(error);
    return response.status(constants.statusCode.serverError).json({
      statusCode: constants.statusCode.serverError,
      message: constants.comment.getError,
    });
  }
};

/**
 * Deletes comment
 * @param {Request} request
 * @param {Response} response
 * @returns {Promise<Response>}
 */
export const deleteComment = async (
  request: Request,
  response: Response
): Promise<Response> => {
  try {
    const { id } = request.params;
    await deleteCommentModel(id);
    return response.status(constants.statusCode.success).json({
      statusCode: constants.statusCode.success,
      message: constants.comment.deleteSuccess,
    });
  } catch (error) {
    console.error(constants.comment.deleteFailure);
    console.error(error);
    return response.status(constants.statusCode.serverError).json({
      statusCode: constants.statusCode.serverError,
      message: constants.comment.deleteFailure,
    });
  }
};

/**
 * Models
 */

/**
 * Add comment for the given `note id`
 * @param {Comment} data
 * @returns {Promise}
 */
const addCommentModel = (data: Comment): Promise<any> => {
  const currentTime = moment()
    .utcOffset("+05:30")
    .format("YYYY-MM-DD HH:mm:ss");
  const sql = `
      INSERT INTO comments (user_id, note_id,
      comment, created_on) VALUES (?,?,?,?)
    `;
  return new Promise((resolve, reject): any => {
    appDB.run(
      sql,
      [data.userId, data.noteId, data.comment, currentTime],
      (err) => {
        if (err) {
          console.error(err);
          reject("error at addCommentModel method");
        } else {
          resolve("success");
        }
      }
    );
  });
};

/**
 * Updates comment
 * @param {Comment} data
 * @returns {Promise}
 */
const updateComment = (data: Comment): Promise<any> => {
  const sql = `
      UPDATE comments
      SET comment=?
      WHERE user_id=? 
      AND note_id=?
      AND id=?
    `;
  return new Promise((resolve, reject): any => {
    appDB.run(sql, [data.comment, data.userId, data.noteId, data.id], (err) => {
      if (err) {
        reject("error at updateComment method");
      } else {
        resolve("success");
      }
    });
  });
};

/**
 * Gets the comments for note
 *
 * * Fetch a comment with `comment id`
 * * Filter with `note id` or `user id` or both
 * * Paginate with `limit` and `offset`
 * @param {string} commentId
 * @param {string} noteId
 * @param {string} userId
 * @param {string} limit
 * @param {string} offset
 * @returns {Promise}
 */
const getCommentModel = (
  commentId?: string,
  noteId?: string,
  userId?: string,
  limit?: string,
  offset?: string
): Promise<any> => {
  let sql: string = `
    SELECT
        c.*,
        u.fullname AS user
    FROM
        comments c,
        users u
    WHERE
        c.user_id = u.id
    `;
  if (commentId) {
    sql = sql + ` AND c.id=${commentId}`;
  }
  if (noteId && userId) {
    sql = sql + ` AND c.note_id=${noteId} AND c.user_id=${userId}`;
  } else if (noteId) {
    sql = sql + ` AND c.note_id=${noteId}`;
  } else if (userId) {
    sql = sql + ` AND c.user_id=${userId}`;
  }
  sql = sql + ` ORDER BY c.id DESC`;
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
        reject("Error at getCommentModel method");
      } else {
        resolve(data);
      }
    });
  });
};

/**
 * Deletes a comment
 * @param {string} id
 * @returns {Promise}
 */
const deleteCommentModel = (id: string): Promise<any> => {
  const sql = `DELETE FROM comments WHERE id=?`;
  return new Promise((resolve, reject): any => {
    appDB.run(sql, [id], (err) => {
      if (err) {
        reject("Error at deleteCommentModel method");
      } else {
        resolve("success");
      }
    });
  });
};
