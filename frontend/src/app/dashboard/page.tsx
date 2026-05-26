"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import TaskCard from "@/components/TaskCard";
import TaskForm from "@/components/TaskForm";
import ConfirmModal from "@/components/ConfirmModal";
import { taskApi, userApi } from "@/lib/api";
import { Task, TaskFormData, User } from "@/types";

type Tab = "tasks" | "users";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tab, setTab] = useState<Tab>("tasks");
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoadingTasks(true);
    try {
      const data = await taskApi.getAll();
      setTasks(data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const data = await userApi.getAll();
      setUsers(data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (isAdmin && tab === "users" && users.length === 0) {
      fetchUsers();
    }
  }, [isAdmin, tab, users.length, fetchUsers]);

  const handleCreate = async (data: TaskFormData) => {
    await taskApi.create(data);
    toast.success("Task created");
    setShowForm(false);
    fetchTasks();
  };

  const handleUpdate = async (data: TaskFormData) => {
    if (!editingTask) return;
    await taskApi.update(editingTask._id, data);
    toast.success("Task updated");
    setEditingTask(undefined);
    fetchTasks();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTaskId) return;
    try {
      await taskApi.delete(deletingTaskId);
      toast.success("Task deleted");
      setDeletingTaskId(null);
      fetchTasks();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete task");
      setDeletingTaskId(null);
    }
  };

  const openEdit = (task: Task) => setEditingTask(task);
  const closeForm = () => {
    setShowForm(false);
    setEditingTask(undefined);
  };
  const openDelete = (id: string) => setDeletingTaskId(id);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {isAdmin ? "Admin Dashboard" : "My Tasks"}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Welcome back, {user?.name}
            </p>
          </div>

          {tab === "tasks" && (
            <button
              onClick={() => setShowForm(true)}
              className="py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              + New Task
            </button>
          )}
        </div>

        {isAdmin && (
          <div className="flex gap-1 border-b border-gray-200 mb-6">
            {(["tasks", "users"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                  tab === t
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {tab === "tasks" && (
          <>
            {loadingTasks ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-sm">No tasks yet.</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-2 text-sm text-blue-600 hover:underline"
                >
                  Create your first task
                </button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    showOwner={isAdmin}
                    onEdit={openEdit}
                    onDelete={openDelete}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "users" && isAdmin && (
          <>
            {loadingUsers ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">
                        Name
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">
                        Email
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">
                        Role
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">{u.name}</td>
                        <td className="px-4 py-3 text-gray-500">{u.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                              u.role === "admin"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-6 text-center text-gray-400"
                        >
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>

      {(showForm || editingTask) && (
        <TaskForm
          initial={editingTask}
          onSubmit={editingTask ? handleUpdate : handleCreate}
          onCancel={closeForm}
        />
      )}

      {deletingTaskId && (
        <ConfirmModal
          message="This task will be permanently deleted."
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingTaskId(null)}
        />
      )}
    </div>
  );
}
