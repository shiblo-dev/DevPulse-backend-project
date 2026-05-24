import { Router } from "express";
import auth from "../../middleware/auth.js";
import { USER_ROLE } from "../../types/index.js";
import {
  createIssue,
  getAllIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
} from "./issue.controller.js";
const router = Router();
router.get("/", getAllIssues);
router.get("/:id", getIssueById);
router.post(
  "/",
  auth(USER_ROLE.CONTRIBUTOR, USER_ROLE.MAINTAINER),
  createIssue,
);
router.patch(
  "/:id",
  auth(USER_ROLE.CONTRIBUTOR, USER_ROLE.MAINTAINER),
  updateIssue,
);
router.delete("/:id", auth(USER_ROLE.MAINTAINER), deleteIssue);

export const issueRoutes = router;
