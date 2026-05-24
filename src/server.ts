import app from "./app.js";
import config from "./config/index.js";
import { initDB } from "./db/index.js";

const main = async () => {
  try {
    await initDB();
    app.listen(config.port, () => {
      console.log(`Devpulse server is running on port ${config.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

main();
