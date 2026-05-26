import { Response } from "express";
import * as userService from "../services/user.service";
import { AuthRequest } from "../types";

export const getUsers = async (
  _req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch users";
    res.status(500).json({ message });
  }
};
