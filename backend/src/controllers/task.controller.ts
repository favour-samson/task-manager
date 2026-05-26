import { Response } from "express";
import * as taskService from "../services/task.service";
import { AuthRequest } from "../types";

export const getTasks = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const tasks = await taskService.getTasks(req.user!.id, req.user!.role);
    res.json(tasks);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch tasks";
    res.status(500).json({ message });
  }
};

export const createTask = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { title, description, status, priority } = req.body;

    if (!title?.trim()) {
      res.status(400).json({ message: "Title is required" });
      return;
    }

    const task = await taskService.createTask({
      title: title.trim(),
      description: description?.trim(),
      status,
      priority,
      userId: req.user!.id,
    });

    res.status(201).json(task);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to create task";
    res.status(400).json({ message });
  }
};

export const updateTask = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const task = await taskService.updateTask(
      req.params.id,
      req.user!.id,
      req.user!.role,
      req.body,
    );
    res.json(task);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to update task";
    const status =
      message === "Task not found" ? 404 : message === "Forbidden" ? 403 : 400;
    res.status(status).json({ message });
  }
};

export const deleteTask = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    await taskService.deleteTask(req.params.id, req.user!.id, req.user!.role);
    res.json({ message: "Task deleted successfully" });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to delete task";
    const status =
      message === "Task not found" ? 404 : message === "Forbidden" ? 403 : 400;
    res.status(status).json({ message });
  }
};
