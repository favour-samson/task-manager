import jwt from "jsonwebtoken";
import User from "../models/User.model";
import { JwtPayload, UserRole } from "../types";

const signAccess = (id: string, role: UserRole): string =>
  jwt.sign({ id, role }, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN ||
      "1h") as jwt.SignOptions["expiresIn"],
  });

const signRefresh = (id: string, role: UserRole): string =>
  jwt.sign({ id, role }, process.env.JWT_REFRESH_SECRET!, { expiresIn: "7d" });

export const register = async (
  name: string,
  email: string,
  password: string,
  role?: UserRole,
) => {
  const existing = await User.findOne({ email });
  if (existing) throw new Error("Email already in use");

  const user = await User.create({
    name,
    email,
    password,
    role: role || "user",
  });

  const accessToken = signAccess(user.id, user.role);
  const refreshToken = signRefresh(user.id, user.role);

  user.refreshToken = refreshToken;
  await user.save();

  return { accessToken, refreshToken, user };
};

export const login = async (email: string, password: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid credentials");

  const valid = await user.comparePassword(password);
  if (!valid) throw new Error("Invalid credentials");

  const accessToken = signAccess(user.id, user.role);
  const refreshToken = signRefresh(user.id, user.role);

  user.refreshToken = refreshToken;
  await user.save();

  return { accessToken, refreshToken, user };
};

export const refresh = async (refreshToken: string) => {
  const decoded = jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_SECRET!,
  ) as JwtPayload;

  const user = await User.findById(decoded.id);
  if (!user || user.refreshToken !== refreshToken) {
    throw new Error("Invalid refresh token");
  }

  const accessToken = signAccess(user.id, user.role);
  return { accessToken, user };
};

export const logout = async (refreshToken: string) => {
  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!,
    ) as JwtPayload;
    await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
  } catch {
    // token invalid — nothing to clear in DB
  }
};
