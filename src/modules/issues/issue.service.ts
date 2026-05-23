import { pool } from "../../db";
import AppError from "../../utils/AppError";

type IssueType = "bug" | "feature_request";
type IssueStatus = "open" | "in_progress" | "resolved";

type User = {
  id: number;
  name: string;
  role: "contributor" | "maintainer";
};

type CreateIssueBody = {
  title: string;
  description: string;
  type: IssueType;
};

type UpdateIssueBody = {
  title?: string;
  description?: string;
  type?: IssueType;
  status?: IssueStatus;
};

type IssueQuery = {
  sort?: string;
  type?: string;
  status?: string;
};
export const createIssue = async (user: User, body: CreateIssueBody) => {
  const { title, description, type } = body;

  if (!title || title.length > 150) {
    throw new AppError(
      "Title is required and must be under 150 characters",
      400,
    );
  }

  if (!description || description.length < 20) {
    throw new AppError("Description must be at least 20 characters", 400);
  }

  if (!["bug", "feature_request"].includes(type)) {
    throw new AppError("Type must be bug or feature_request", 400);
  }

  const result = await pool.query(
    `INSERT INTO issues (title, description, type, status, reporter_id)
     VALUES ($1, $2, $3, 'open', $4)
     RETURNING *`,
    [title, description, type, user.id],
  );

  return result.rows[0];
};
export const getAllIssues = async (query: IssueQuery) => {
  if (query.type && !["bug", "feature_request"].includes(query.type)) {
    throw new AppError("Invalid type filter", 400);
  }

  if (
    query.status &&
    !["open", "in_progress", "resolved"].includes(query.status)
  ) {
    throw new AppError("Invalid status filter", 400);
  }
  let sql = `SELECT * FROM issues`;
  const values: (string | number)[] = [];
  const conditions: string[] = [];

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

  sql +=
    query.sort === "oldest"
      ? ` ORDER BY created_at ASC`
      : ` ORDER BY created_at DESC`;

  const result = await pool.query(sql, values);
  const issues = result.rows;

  const reporterIds = issues.map((i) => i.reporter_id);

  let usersMap = new Map();

  if (reporterIds.length > 0) {
    const usersRes = await pool.query(
      `SELECT id, name, role FROM users WHERE id = ANY($1)`,
      [reporterIds],
    );
    usersMap = new Map(usersRes.rows.map((u) => [u.id, u]));
  }

  return issues.map((issue) => {
    const { reporter_id, password, ...issueData } = issue;
    return {
      ...issueData,
      reporter: usersMap.get(reporter_id) ?? null,
    };
  });
};
export const getIssueById = async (id: number) => {
  const result = await pool.query(`SELECT * FROM issues WHERE id=$1`, [id]);

  if (!result.rows.length) {
    throw new AppError("Issue not found", 404);
  }

  const issue = result.rows[0];

  const userRes = await pool.query(
    `SELECT id, name, role FROM users WHERE id=$1`,
    [issue.reporter_id],
  );

  const { reporter_id, ...issueData } = issue;

  return {
    ...issueData,
    reporter: userRes.rows[0] ?? null,
  };
};
export const updateIssue = async (
  id: number,
  user: User,
  body: UpdateIssueBody,
) => {
  const issueRes = await pool.query(`SELECT * FROM issues WHERE id=$1`, [id]);

  if (!issueRes.rows.length) {
    throw new AppError("Issue not found", 404);
  }

  const issue = issueRes.rows[0];

  if (user.role === "contributor") {
    if (issue.reporter_id !== user.id) {
      throw new AppError("You can only update your own issue", 403);
    }
    if (issue.status !== "open") {
      throw new AppError("Only open issues can be updated", 409);
    }
  }

  if (body.type && !["bug", "feature_request"].includes(body.type)) {
    throw new AppError("Type must be bug or feature_request", 400);
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
      user.role === "maintainer" ? (body.status ?? issue.status) : issue.status,
      id,
    ],
  );

  return updated.rows[0];
};

export const deleteIssue = async (id: number, user: User) => {
  const result = await pool.query(
    `DELETE FROM issues WHERE id=$1 RETURNING *`,
    [id],
  );

  if (!result.rows.length) {
    throw new AppError("Issue not found", 404);
  }

  return result.rows[0];
};
