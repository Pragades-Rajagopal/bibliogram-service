import appDB from "../connector/database";

export const isUserExists = (userId: number): Promise<any> => {
  const sql = `SELECT 1 as "check" FROM users WHERE id=?`;
  return new Promise((resolve, reject): any => {
    appDB.all(sql, [userId], (err, data) => {
      if (err) {
        reject("Asset validation -- Error at isUserExists model");
      } else {
        resolve(data);
      }
    });
  });
};

export const isBookExists = (bookId: number): Promise<any> => {
  const sql = `SELECT 1 as "check" FROM books WHERE id=?`;
  return new Promise((resolve, reject): any => {
    appDB.all(sql, [bookId], (err, data) => {
      if (err) {
        reject("Asset validation -- Error at isBookExists model");
      } else {
        resolve(data);
      }
    });
  });
};

export const isBookNoteExists = (noteId: number): Promise<any> => {
  const sql = `SELECT 1 as "check" FROM book_notes WHERE id=?`;
  return new Promise((resolve, reject): any => {
    appDB.all(sql, [noteId], (err, data) => {
      if (err) {
        reject("Asset validation -- Error at isBookNoteExists model");
      } else {
        resolve(data);
      }
    });
  });
};

export const isCommentExists = (commentId: number): Promise<any> => {
  const sql = `SELECT 1 as "check" FROM comments WHERE id=?`;
  return new Promise((resolve, reject): any => {
    appDB.all(sql, [commentId], (err, data) => {
      if (err) {
        reject("Asset validation -- Error at isCommentExists model");
      } else {
        resolve(data);
      }
    });
  });
};
