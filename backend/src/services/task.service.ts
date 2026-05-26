import Task, { ITask, TaskPriority, TaskStatus } from '../models/Task.model';

export const getTasks = async (userId: string, role: string) => {
  if (role === 'admin') {
    return Task.find().populate('userId', 'name email').sort({ createdAt: -1 });
  }
  return Task.find({ userId }).sort({ createdAt: -1 });
};

export const createTask = async (data: {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  userId: string;
}) => {
  return Task.create(data);
};

export const updateTask = async (
  id: string,
  userId: string,
  role: string,
  data: Partial<Pick<ITask, 'title' | 'description' | 'status' | 'priority'>>
) => {
  const task = await Task.findById(id);
  if (!task) throw new Error('Task not found');
  if (role !== 'admin' && task.userId.toString() !== userId) {
    throw new Error('Forbidden');
  }

  Object.assign(task, data);
  return task.save();
};

export const deleteTask = async (id: string, userId: string, role: string) => {
  const task = await Task.findById(id);
  if (!task) throw new Error('Task not found');
  if (role !== 'admin' && task.userId.toString() !== userId) {
    throw new Error('Forbidden');
  }

  await task.deleteOne();
};
