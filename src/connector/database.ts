import path from "path";
import * as sqlite3 from "sqlite3";
let sqlite = sqlite3.verbose();

const dbPath = path.resolve(__dirname, "../../", "db.sqlite");
const appDB = new sqlite.Database(
  dbPath,
  sqlite.OPEN_READWRITE,
  (error: any) => {
    if (error) {
      console.log("database connection error :: ", error);
    } else {
      console.log("connected to database");
    }
  }
);

export default appDB;
