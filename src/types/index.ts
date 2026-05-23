import type { Request } from "express";

export type ROLES = "contributor" | "maintainer";

export const USER_ROLE = {
  CONTRIBUTOR: "contributor",
  MAINTAINER: "maintainer",
} as const;

export interface AuthRequest extends Request {
  user?: {
    id: number;
    name: string;
    role: ROLES;
  };
}
