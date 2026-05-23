"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/app.ts
var import_express3 = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);

// src/config/index.ts
var import_dotenv = __toESM(require("dotenv"), 1);
var import_path = __toESM(require("path"), 1);
import_dotenv.default.config({
  path: import_path.default.join(process.cwd(), ".env")
});
if (!process.env.CONNECTIONSTRING) {
  throw new Error("CONNECTIONSTRING is not defined in .env");
}
if (!process.env.SECRET) {
  throw new Error("SECRET is not defined in .env");
}
var config = {
  port: process.env.PORT || 5e3,
  connection_string: process.env.CONNECTIONSTRING,
  secret: process.env.SECRET,
  node_env: process.env.NODE_ENV || "development"
};
var config_default = config;

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, _next) => {
  if (config_default.node_env === "development") {
    console.error(err.stack);
  }
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
};
var globalErrorHandler_default = globalErrorHandler;

// src/modules/auth/auth.route.ts
var import_express = require("express");

// src/modules/auth/auth.service.ts
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);

// src/db/index.ts
var import_pg = require("pg");
var pool = new import_pg.Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'contributor' CHECK (role IN ('contributor', 'maintainer')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS issues (
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL CHECK (char_length(description) >= 20),
        type VARCHAR(30) NOT NULL CHECK (type IN ('bug', 'feature_request')),
        status VARCHAR(30) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
        reporter_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Database connected and tables ready!");
  } catch (error) {
    console.error("Database initialization failed:", error);
    process.exit(1);
  }
};

// src/utils/AppError.ts
var AppError = class extends Error {
  statusCode;
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
};
var AppError_default = AppError;

// src/modules/auth/auth.service.ts
var SALT_ROUNDS = 10;
var registerUserIntoDB = async (payload) => {
  const { name, email, password, role = "contributor" } = payload;
  const isUserExists = await pool.query(`SELECT id FROM users WHERE email=$1`, [
    email
  ]);
  if (isUserExists.rows.length > 0) {
    throw new AppError_default("User already exists!", 409);
  }
  const hashedPassword = await import_bcryptjs.default.hash(password, SALT_ROUNDS);
  const result = await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at, updated_at`,
    [name, email, hashedPassword, role]
  );
  return result.rows[0];
};
var loginUserIntoDB = async (payload) => {
  const { email, password } = payload;
  const userData = await pool.query(`SELECT * FROM users WHERE email=$1`, [
    email
  ]);
  if (userData.rows.length === 0) {
    throw new AppError_default("User not found", 404);
  }
  const user = userData.rows[0];
  const matchPassword = await import_bcryptjs.default.compare(password, user.password);
  if (!matchPassword) {
    throw new AppError_default("Invalid credentials", 401);
  }
  const jwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role,
    email: user.email
  };
  const token = import_jsonwebtoken.default.sign(jwtPayload, config_default.secret, { expiresIn: "1d" });
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  };
};
var authService = {
  registerUserIntoDB,
  loginUserIntoDB
};

// src/modules/auth/auth.controller.ts
var registerUser = async (req, res, next) => {
  try {
    const result = await authService.registerUserIntoDB(req.body);
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var loginUser = async (req, res, next) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token: result.token,
        user: result.user
      }
    });
  } catch (error) {
    next(error);
  }
};
var authController = {
  registerUser,
  loginUser
};

// src/modules/auth/auth.route.ts
var router = (0, import_express.Router)();
router.post("/signup", authController.registerUser);
router.post("/login", authController.loginUser);
var authRoute = router;

// src/modules/issues/issue.route.ts
var import_express2 = require("express");

// src/middleware/auth.ts
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"), 1);
var auth = (...roles) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized access!"
        });
      }
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
      const decoded = import_jsonwebtoken2.default.verify(token, config_default.secret);
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden! No access"
        });
      }
      req.user = {
        id: decoded.id,
        name: decoded.name,
        role: decoded.role
      };
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token"
      });
    }
  };
};
var auth_default = auth;

// src/types/index.ts
var USER_ROLE = {
  CONTRIBUTOR: "contributor",
  MAINTAINER: "maintainer"
};

// src/modules/issues/issue.service.ts
var createIssue = async (user, body) => {
  const { title, description, type } = body;
  if (!title || title.length > 150) {
    throw new AppError_default(
      "Title is required and must be under 150 characters",
      400
    );
  }
  if (!description || description.length < 20) {
    throw new AppError_default("Description must be at least 20 characters", 400);
  }
  if (!["bug", "feature_request"].includes(type)) {
    throw new AppError_default("Type must be bug or feature_request", 400);
  }
  const result = await pool.query(
    `INSERT INTO issues (title, description, type, status, reporter_id)
     VALUES ($1, $2, $3, 'open', $4)
     RETURNING *`,
    [title, description, type, user.id]
  );
  return result.rows[0];
};
var getAllIssues = async (query) => {
  if (query.type && !["bug", "feature_request"].includes(query.type)) {
    throw new AppError_default("Invalid type filter", 400);
  }
  if (query.status && !["open", "in_progress", "resolved"].includes(query.status)) {
    throw new AppError_default("Invalid status filter", 400);
  }
  let sql = `SELECT * FROM issues`;
  const values = [];
  const conditions = [];
  if (query.type) {
    values.push(query.type);
    conditions.push(`type = $${values.length}`);
  }
  if (query.status) {
    values.push(query.status);
    conditions.push(`status = $${values.length}`);
  }
  if (conditions.length) {
    sql += ` WHERE ` + conditions.join(" AND ");
  }
  sql += query.sort === "oldest" ? ` ORDER BY created_at ASC` : ` ORDER BY created_at DESC`;
  const result = await pool.query(sql, values);
  const issues = result.rows;
  const reporterIds = issues.map((i) => i.reporter_id);
  let usersMap = /* @__PURE__ */ new Map();
  if (reporterIds.length > 0) {
    const usersRes = await pool.query(
      `SELECT id, name, role FROM users WHERE id = ANY($1)`,
      [reporterIds]
    );
    usersMap = new Map(usersRes.rows.map((u) => [u.id, u]));
  }
  return issues.map((issue) => {
    const { reporter_id, password, ...issueData } = issue;
    return {
      ...issueData,
      reporter: usersMap.get(reporter_id) ?? null
    };
  });
};
var getIssueById = async (id) => {
  const result = await pool.query(`SELECT * FROM issues WHERE id=$1`, [id]);
  if (!result.rows.length) {
    throw new AppError_default("Issue not found", 404);
  }
  const issue = result.rows[0];
  const userRes = await pool.query(
    `SELECT id, name, role FROM users WHERE id=$1`,
    [issue.reporter_id]
  );
  const { reporter_id, ...issueData } = issue;
  return {
    ...issueData,
    reporter: userRes.rows[0] ?? null
  };
};
var updateIssue = async (id, user, body) => {
  const issueRes = await pool.query(`SELECT * FROM issues WHERE id=$1`, [id]);
  if (!issueRes.rows.length) {
    throw new AppError_default("Issue not found", 404);
  }
  const issue = issueRes.rows[0];
  if (user.role === "contributor") {
    if (issue.reporter_id !== user.id) {
      throw new AppError_default("You can only update your own issue", 403);
    }
    if (issue.status !== "open") {
      throw new AppError_default("Only open issues can be updated", 409);
    }
  }
  if (body.type && !["bug", "feature_request"].includes(body.type)) {
    throw new AppError_default("Type must be bug or feature_request", 400);
  }
  const updated = await pool.query(
    `UPDATE issues
     SET title=$1,
         description=$2,
         type=$3,
         status=$4,
         updated_at=NOW()
     WHERE id=$5
     RETURNING *`,
    [
      body.title ?? issue.title,
      body.description ?? issue.description,
      body.type ?? issue.type,
      user.role === "maintainer" ? body.status ?? issue.status : issue.status,
      id
    ]
  );
  return updated.rows[0];
};
var deleteIssue = async (id, user) => {
  const result = await pool.query(
    `DELETE FROM issues WHERE id=$1 RETURNING *`,
    [id]
  );
  if (!result.rows.length) {
    throw new AppError_default("Issue not found", 404);
  }
  return result.rows[0];
};

// src/modules/issues/issue.controller.ts
var createIssue2 = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const result = await createIssue(req.user, req.body);
    return res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllIssues2 = async (req, res, next) => {
  try {
    const result = await getAllIssues(req.query);
    return res.status(200).json({
      success: true,
      message: "Issues retrived successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getIssueById2 = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid issue ID"
      });
    }
    const result = await getIssueById(id);
    return res.status(200).json({
      success: true,
      message: "Issue retrived successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateIssue2 = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid issue ID"
      });
    }
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const result = await updateIssue(id, req.user, req.body);
    return res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var deleteIssue2 = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid issue ID"
      });
    }
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    await deleteIssue(id, req.user);
    return res.status(200).json({
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

// src/modules/issues/issue.route.ts
var router2 = (0, import_express2.Router)();
router2.get("/", getAllIssues2);
router2.get("/:id", getIssueById2);
router2.post("/", auth_default(USER_ROLE.CONTRIBUTOR, USER_ROLE.MAINTAINER), createIssue2);
router2.patch("/:id", auth_default(USER_ROLE.CONTRIBUTOR, USER_ROLE.MAINTAINER), updateIssue2);
router2.delete("/:id", auth_default(USER_ROLE.MAINTAINER), deleteIssue2);
var issueRoutes = router2;

// src/app.ts
var app = (0, import_express3.default)();
app.use(
  (0, import_cors.default)({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true
  })
);
app.use(import_express3.default.json());
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Devpulse server is running!!"
  });
});
app.use("/api/auth", authRoute);
app.use("/api/issues", issueRoutes);
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});
app.use(globalErrorHandler_default);
var app_default = app;

// src/server.ts
var main = async () => {
  try {
    await initDB();
    app_default.listen(config_default.port, () => {
      console.log(`Devpulse server is running on port ${config_default.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};
main();
//# sourceMappingURL=server.js.map