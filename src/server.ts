import dotenv from "dotenv";
dotenv.config();
import express, { Express } from "express";
import router from "./routes/common.route";

let app: Express = express();
let PORT: any = process.env.PORT || 8080;

app.use(express.json());
app.use("/api", router);

app.listen(PORT, () => {
  console.log(`app is running in port:${PORT}`);
});
