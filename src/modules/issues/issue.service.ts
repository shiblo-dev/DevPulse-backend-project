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
