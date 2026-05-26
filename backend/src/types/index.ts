import { Request } from "express";

export type UserRole = "admin" | "user";

export interface JwtPayload {
  id: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}
