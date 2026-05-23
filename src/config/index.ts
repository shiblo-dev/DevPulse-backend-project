import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

if (!process.env.CONNECTIONSTRING) {
  throw new Error("CONNECTIONSTRING is not defined in .env");
}
if (!process.env.SECRET) {
  throw new Error("SECRET is not defined in .env");
}

const config = {
  port: process.env.PORT || 5000,
  connection_string: process.env.CONNECTIONSTRING,
  secret: process.env.SECRET,
  node_env: process.env.NODE_ENV || "development",
};

export default config;