import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { UserRole } from "../types";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      res
        .status(400)
        .json({ message: "Name, email, and password are required" });
      return;
    }

    if (password.length < 6) {
      res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
      return;
    }

    const { accessToken, refreshToken, user } = await authService.register(
      name.trim(),
      email.trim(),
      password,
      role as UserRole,
    );

    res.cookie("refreshToken", refreshToken, COOKIE_OPTS);
    res.status(201).json({
      token: accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Registration failed";
    res.status(400).json({ message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const { accessToken, refreshToken, user } = await authService.login(
      email.trim(),
      password,
    );

    res.cookie("refreshToken", refreshToken, COOKIE_OPTS);
    res.json({
      token: accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Login failed";
    res.status(401).json({ message });
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      res.status(401).json({ message: "No refresh token" });
      return;
    }

    const { accessToken, user } = await authService.refresh(token);
    res.json({
      token: accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch {
    res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) await authService.logout(token);
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Logout failed";
    res.status(500).json({ message });
  }
};
