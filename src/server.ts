import app from "./app";
import config from "./config/index";
import { initDB } from "./db/index";

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
