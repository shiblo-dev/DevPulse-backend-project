import { ROLES } from "./index";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        name: string;
        role: ROLES;
      };
    }
  }
}
