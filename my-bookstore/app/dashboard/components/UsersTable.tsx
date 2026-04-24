"use client";

import { useEffect, useState } from "react";
import axios from "axios";

// ── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({ baseURL: "http://localhost:8080" });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Types ─────────────────────────────────────────────────────────────────────
type User = {
  id: number;
  username: string;
  email: string;
  role: string;
};

type UserDetail = User & {
  totalOrders: number;
  totalSpent: number;
  orders: { id: number; book: string; amount: string; status: string }[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const roleStyle: Record<string, string> = {
  ADMIN: "bg-amber-100 text-amber-800 border border-amber-200",
  USER:  "bg-stone-100 text-stone-600 border border-stone-200",
};

const statusStyle: Record<string, string> = {
  Delivered: "bg-emerald-100 text-emerald-700",
  Pending:   "bg-amber-100 text-amber-700",
  Shipped:   "bg-sky-100 text-sky-700",
  Cancelled: "bg-red-100 text-red-600",
};

function Avatar({ name }: { name: string }) {
  const initials = name.slice(0, 2).toUpperCase();
  const colors = [
    "bg-violet-500", "bg-teal-500", "bg-rose-500",
    "bg-amber-500",  "bg-sky-500",  "bg-emerald-500",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <span
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white ${color}`}
    >
      {initials}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function UsersTable() {
  const [users, setUsers]           = useState<User[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteId, setDeleteId]     = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [toast, setToast]           = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // ── Fetch all users ────────────────────────────────────────────────────────
  const fetchUsers = () => {
    setLoading(true);
    api.get("/users")
      .then((r) => setUsers(r.data))
      .catch(() => showToast("Failed to load users", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  // ── Toast helper ───────────────────────────────────────────────────────────
  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Open user detail drawer ────────────────────────────────────────────────
  const openDetail = async (id: number) => {
    setDetailLoading(true);
    setSelectedUser(null);
    try {
      const r = await api.get(`/users/${id}`);
      setSelectedUser(r.data);
    } catch {
      showToast("Failed to load user details", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Delete user ───────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    setDeleteId(id);
    try {
      await api.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      if (selectedUser?.id === id) setSelectedUser(null);
      setConfirmDelete(null);
      showToast("User deleted successfully", "success");
    } catch {
      showToast("Failed to delete user", "error");
    } finally {
      setDeleteId(null);
    }
  };

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative flex gap-6">

      {/* ── Toast ────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-3 text-sm font-medium shadow-lg transition-all ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          <span>{toast.type === "success" ? "✓" : "✕"}</span>
          {toast.msg}
        </div>
      )}

      {/* ── Main Table Panel ─────────────────────────────────────────────── */}
      <div className={`flex-1 rounded-2xl border border-stone-200 bg-white shadow-sm transition-all ${selectedUser ? "lg:max-w-[calc(100%-360px)]" : ""}`}>

        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-stone-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-stone-900">Users</h2>
            <p className="mt-0.5 text-sm text-stone-400">
              {users.length} registered account{users.length !== 1 ? "s" : ""}
            </p>
          </div>
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-800 placeholder-stone-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:w-64"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-stone-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-blue-500" />
            <p className="text-sm">Loading users…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-sm text-stone-400">
            {search ? `No users matching "${search}"` : "No users registered yet"}
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => openDetail(user.id)}
                  className={`cursor-pointer border-b border-stone-50 transition last:border-0 hover:bg-stone-50 ${
                    selectedUser?.id === user.id ? "bg-blue-50/60" : ""
                  }`}
                >
                  {/* Avatar + name */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.username} />
                      <div>
                        <p className="font-medium text-stone-800">{user.username}</p>
                        <p className="text-xs text-stone-400">#{user.id}</p>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-5 py-3 text-stone-500">{user.email}</td>

                  {/* Role badge */}
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleStyle[user.role] ?? roleStyle.USER}`}>
                      {user.role}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openDetail(user.id)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-500"
                      >
                        View
                      </button>
                      <button
                        onClick={() => setConfirmDelete(user)}
                        disabled={deleteId === user.id}
                        className="text-sm font-medium text-red-500 hover:text-red-400 disabled:opacity-40"
                      >
                        {deleteId === user.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Detail Drawer ─────────────────────────────────────────────────── */}
      {(selectedUser || detailLoading) && (
        <div className="hidden w-[340px] shrink-0 lg:block">
          <div className="sticky top-6 rounded-2xl border border-stone-200 bg-white shadow-sm">

            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
              <h3 className="font-semibold text-stone-900">User details</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-200 border-t-blue-500" />
              </div>
            ) : selectedUser && (
              <div className="p-5">

                {/* User profile block */}
                <div className="mb-5 flex flex-col items-center gap-2 text-center">
                  <Avatar name={selectedUser.username} />
                  <div>
                    <p className="font-semibold text-stone-900">{selectedUser.username}</p>
                    <p className="text-sm text-stone-400">{selectedUser.email}</p>
                  </div>
                  <span className={`mt-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${roleStyle[selectedUser.role] ?? roleStyle.USER}`}>
                    {selectedUser.role}
                  </span>
                </div>

                {/* Stats row */}
                <div className="mb-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-stone-100 bg-stone-50 p-3 text-center">
                    <p className="text-xl font-bold text-stone-900">{selectedUser.totalOrders}</p>
                    <p className="text-xs text-stone-400">Total orders</p>
                  </div>
                  <div className="rounded-xl border border-stone-100 bg-stone-50 p-3 text-center">
                    <p className="text-xl font-bold text-stone-900">₹{Math.round(selectedUser.totalSpent)}</p>
                    <p className="text-xs text-stone-400">Total spent</p>
                  </div>
                </div>

                {/* Order history */}
                <div className="mb-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-400">
                    Order history
                  </p>
                  {selectedUser.orders.length === 0 ? (
                    <p className="py-4 text-center text-sm text-stone-400">No orders yet</p>
                  ) : (
                    <ul className="space-y-2">
                      {selectedUser.orders.map((order) => (
                        <li
                          key={order.id}
                          className="flex items-center justify-between rounded-lg border border-stone-100 bg-stone-50 px-3 py-2.5"
                        >
                          <div>
                            <p className="text-sm font-medium text-stone-700">{order.book}</p>
                            <p className="text-xs text-stone-400">#{order.id}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-sm font-semibold text-stone-800">{order.amount}</span>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle[order.status] ?? "bg-stone-100 text-stone-600"}`}>
                              {order.status}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Delete button in drawer */}
                <button
                  onClick={() => setConfirmDelete(selectedUser)}
                  className="w-full rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-100"
                >
                  Delete this user
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ──────────────────────────────────────────── */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <span className="text-xl text-red-600">!</span>
            </div>

            <h3 className="mb-1 text-lg font-semibold text-stone-900">Delete user?</h3>
            <p className="mb-6 text-sm text-stone-500">
              <span className="font-medium text-stone-700">{confirmDelete.username}</span> ({confirmDelete.email}) will be permanently removed. This cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-xl border border-stone-200 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                disabled={deleteId === confirmDelete.id}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
              >
                {deleteId === confirmDelete.id ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}