import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import config from "./config/index.js";
import { initDB } from "./db/index.js";
const app: Application = express();

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});
const main = () => {
  initDB();
  app.listen(config.port, () => {
    initDB();
    console.log(`Example app listening on port ${config.port}`);
  });
};

main();
