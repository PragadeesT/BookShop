"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";

// ── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({ baseURL: "http://localhost:8080" });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Types ─────────────────────────────────────────────────────────────────────
type Order = {
  id: number;
  book: string;
  bookId: number;
  user: string;
  userId: number;
  quantity: number;
  amount: number;
  status: "PENDING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  createdAt: string;
};

type StatusKey = "ALL" | Order["status"];

// ── Config ────────────────────────────────────────────────────────────────────
const STATUSES: Order["status"][] = ["PENDING", "SHIPPED", "DELIVERED", "CANCELLED"];

const STATUS_META: Record<Order["status"], { label: string; pill: string; dot: string }> = {
  PENDING:   { label: "Pending",   pill: "bg-amber-100 text-amber-800 border border-amber-200",   dot: "bg-amber-400" },
  SHIPPED:   { label: "Shipped",   pill: "bg-sky-100 text-sky-800 border border-sky-200",          dot: "bg-sky-400"   },
  DELIVERED: { label: "Delivered", pill: "bg-emerald-100 text-emerald-800 border border-emerald-200", dot: "bg-emerald-400" },
  CANCELLED: { label: "Cancelled", pill: "bg-red-100 text-red-700 border border-red-200",          dot: "bg-red-400"   },
};

const NEXT_STATUS: Partial<Record<Order["status"], Order["status"][]>> = {
  PENDING:   ["SHIPPED", "CANCELLED"],
  SHIPPED:   ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: Order["status"] }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${m.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium shadow-lg ${
      type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
    }`}>
      <span className="text-base">{type === "success" ? "✓" : "✕"}</span>
      {msg}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function OrdersTable() {
  const [orders, setOrders]         = useState<Order[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusKey>("ALL");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Order | null>(null);
  const [toast, setToast]           = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchOrders = () => {
    setLoading(true);
    api.get("/orders")
      .then((r) => setOrders(r.data))
      .catch(() => showToast("Failed to load orders", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Update status ──────────────────────────────────────────────────────────
  const updateStatus = async (orderId: number, status: Order["status"]) => {
    setUpdatingId(orderId);
    try {
      const res = await api.patch(`/orders/${orderId}/status`, { status });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: res.data.status } : o))
      );
      if (selectedOrder?.id === orderId)
        setSelectedOrder((prev) => prev ? { ...prev, status: res.data.status } : prev);
      showToast("Order status updated", "success");
    } catch {
      showToast("Failed to update status", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const deleteOrder = async (orderId: number) => {
    setDeletingId(orderId);
    try {
      await api.delete(`/orders/${orderId}`);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      if (selectedOrder?.id === orderId) setSelectedOrder(null);
      setConfirmDelete(null);
      showToast("Order deleted", "success");
    } catch {
      showToast("Failed to delete order", "error");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total    = orders.length;
    const revenue  = orders.reduce((s, o) => s + (o.amount || 0), 0);
    const pending  = orders.filter((o) => o.status === "PENDING").length;
    const delivered = orders.filter((o) => o.status === "DELIVERED").length;
    return { total, revenue, pending, delivered };
  }, [orders]);

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = useMemo(() =>
    orders.filter((o) => {
      const matchStatus = filterStatus === "ALL" || o.status === filterStatus;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        o.book.toLowerCase().includes(q) ||
        o.user.toLowerCase().includes(q) ||
        String(o.id).includes(q);
      return matchStatus && matchSearch;
    }),
  [orders, filterStatus, search]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative space-y-5">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* ── Stats Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total orders",  value: stats.total,                      color: "text-stone-900" },
          { label: "Revenue",       value: `₹${Math.round(stats.revenue)}`,  color: "text-emerald-700" },
          { label: "Pending",       value: stats.pending,                     color: "text-amber-600" },
          { label: "Delivered",     value: stats.delivered,                   color: "text-sky-700" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-stone-400">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Main Panel ─────────────────────────────────────────────────────── */}
      <div className={`flex gap-5 transition-all`}>
        <div className={`flex-1 rounded-2xl border border-stone-200 bg-white shadow-sm ${selectedOrder ? "lg:max-w-[calc(100%-360px)]" : ""}`}>

          {/* ── Toolbar ──────────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-3 border-b border-stone-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-stone-900">Orders</h2>
              <p className="mt-0.5 text-sm text-stone-400">
                {filtered.length} of {orders.length} order{orders.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="Search book, user, ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-800 placeholder-stone-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:w-52"
              />
            </div>
          </div>

          {/* ── Status filter tabs ────────────────────────────────────────────── */}
          <div className="flex gap-1 overflow-x-auto border-b border-stone-100 px-5 pt-3 pb-0">
            {(["ALL", ...STATUSES] as StatusKey[]).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`shrink-0 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                  filterStatus === s
                    ? "border-b-2 border-blue-600 text-blue-700"
                    : "text-stone-400 hover:text-stone-700"
                }`}
              >
                {s === "ALL" ? "All" : STATUS_META[s].label}
                <span className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${
                  filterStatus === s ? "bg-blue-100 text-blue-700" : "bg-stone-100 text-stone-500"
                }`}>
                  {s === "ALL" ? orders.length : orders.filter((o) => o.status === s).length}
                </span>
              </button>
            ))}
          </div>

          {/* ── Table ────────────────────────────────────────────────────────── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-stone-400">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-blue-500" />
              <p className="text-sm">Loading orders…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-stone-400 text-sm">
                {search || filterStatus !== "ALL"
                  ? "No orders match your filters"
                  : "No orders placed yet"}
              </p>
              {(search || filterStatus !== "ALL") && (
                <button
                  onClick={() => { setSearch(""); setFilterStatus("ALL"); }}
                  className="mt-3 text-sm text-blue-600 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
                    <th className="px-5 py-3 font-medium">Order</th>
                    <th className="px-5 py-3 font-medium">Book</th>
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium">Qty</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Update</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order) => {
                    const nextOptions = NEXT_STATUS[order.status] ?? [];
                    const isUpdating  = updatingId === order.id;
                    const isDeleting  = deletingId === order.id;

                    return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrder(order.id === selectedOrder?.id ? null : order)}
                        className={`cursor-pointer border-b border-stone-50 transition last:border-0 hover:bg-stone-50 ${
                          selectedOrder?.id === order.id ? "bg-blue-50/60" : ""
                        }`}
                      >
                        {/* ID + date */}
                        <td className="px-5 py-3.5">
                          <p className="font-mono text-xs font-semibold text-stone-700">#{order.id}</p>
                          <p className="mt-0.5 text-xs text-stone-400">{order.createdAt}</p>
                        </td>

                        {/* Book */}
                        <td className="px-5 py-3.5">
                          <p className="max-w-[160px] truncate font-medium text-stone-800">{order.book}</p>
                        </td>

                        {/* User */}
                        <td className="px-5 py-3.5 text-stone-500">{order.user}</td>

                        {/* Qty */}
                        <td className="px-5 py-3.5 text-stone-600">{order.quantity}</td>

                        {/* Amount */}
                        <td className="px-5 py-3.5 font-semibold text-stone-800">
                          ₹{Math.round(order.amount)}
                        </td>

                        {/* Status pill */}
                        <td className="px-5 py-3.5">
                          <StatusPill status={order.status} />
                        </td>

                        {/* Status dropdown */}
                        <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                          {nextOptions.length > 0 ? (
                            <select
                              disabled={isUpdating}
                              defaultValue=""
                              onChange={(e) => {
                                if (e.target.value)
                                  updateStatus(order.id, e.target.value as Order["status"]);
                                e.target.value = "";
                              }}
                              className="rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs text-stone-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 disabled:opacity-50 cursor-pointer"
                            >
                              <option value="" disabled>
                                {isUpdating ? "Updating…" : "Move to…"}
                              </option>
                              {nextOptions.map((s) => (
                                <option key={s} value={s}>{STATUS_META[s].label}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-xs text-stone-300">—</span>
                          )}
                        </td>

                        {/* Delete */}
                        <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setConfirmDelete(order)}
                            disabled={isDeleting}
                            className="text-sm font-medium text-red-500 hover:text-red-400 disabled:opacity-40"
                          >
                            {isDeleting ? "…" : "Delete"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Detail Drawer ───────────────────────────────────────────────── */}
        {selectedOrder && (
          <div className="hidden w-[340px] shrink-0 lg:block">
            <div className="sticky top-6 rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
                <div>
                  <h3 className="font-semibold text-stone-900">Order #{selectedOrder.id}</h3>
                  <p className="text-xs text-stone-400 mt-0.5">{selectedOrder.createdAt}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-stone-400 hover:text-stone-700 text-lg leading-none"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-5">

                {/* Status */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">Status</p>
                  <StatusPill status={selectedOrder.status} />
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Details</p>
                  {[
                    { label: "Book",     value: selectedOrder.book },
                    { label: "Customer", value: selectedOrder.user },
                    { label: "Quantity", value: String(selectedOrder.quantity) },
                    { label: "Amount",   value: `₹${Math.round(selectedOrder.amount)}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between rounded-lg bg-stone-50 px-3 py-2.5">
                      <span className="text-sm text-stone-400">{label}</span>
                      <span className="text-sm font-medium text-stone-800 text-right max-w-[180px] truncate">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Timeline */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-400">Timeline</p>
                  <div className="relative pl-5">
                    {STATUSES.map((s, i) => {
                      const statusOrder = ["PENDING", "SHIPPED", "DELIVERED", "CANCELLED"];
                      const currentIdx  = statusOrder.indexOf(selectedOrder.status);
                      const thisIdx     = statusOrder.indexOf(s);

                      const isCancelled = selectedOrder.status === "CANCELLED";
                      const isDone      = !isCancelled && thisIdx <= currentIdx;
                      const isCurrent   = s === selectedOrder.status;
                      const isCancelledStep = isCancelled && s === "CANCELLED";

                      return (
                        <div key={s} className="relative flex items-start gap-3 pb-4 last:pb-0">
                          {/* Vertical line */}
                          {i < STATUSES.length - 1 && (
                            <div className={`absolute left-[7px] top-4 h-full w-0.5 ${
                              isDone && !isCancelled ? "bg-emerald-300" : "bg-stone-200"
                            }`} />
                          )}
                          {/* Dot */}
                          <div className={`relative z-10 mt-0.5 h-3.5 w-3.5 rounded-full border-2 shrink-0 ${
                            isCancelledStep ? "border-red-400 bg-red-100" :
                            isCurrent       ? "border-emerald-500 bg-emerald-500" :
                            isDone          ? "border-emerald-400 bg-emerald-100" :
                            "border-stone-300 bg-white"
                          }`} />
                          {/* Label */}
                          <p className={`text-sm ${
                            isCancelledStep ? "font-medium text-red-600" :
                            isCurrent       ? "font-medium text-stone-900" :
                            isDone          ? "text-stone-600" :
                            "text-stone-300"
                          }`}>
                            {STATUS_META[s].label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick status change buttons */}
                {(NEXT_STATUS[selectedOrder.status]?.length ?? 0) > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">Move to</p>
                    <div className="flex flex-wrap gap-2">
                      {NEXT_STATUS[selectedOrder.status]!.map((s) => (
                        <button
                          key={s}
                          onClick={() => updateStatus(selectedOrder.id, s)}
                          disabled={updatingId === selectedOrder.id}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                            s === "CANCELLED"
                              ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                          } disabled:opacity-50`}
                        >
                          {updatingId === selectedOrder.id ? "Updating…" : STATUS_META[s].label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Delete */}
                <button
                  onClick={() => setConfirmDelete(selectedOrder)}
                  className="w-full rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 transition"
                >
                  Delete order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

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
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <span className="text-xl text-red-600">!</span>
            </div>
            <h3 className="mb-1 text-lg font-semibold text-stone-900">Delete order?</h3>
            <p className="mb-6 text-sm text-stone-500">
              Order <span className="font-medium text-stone-700">#{confirmDelete.id}</span> for{" "}
              <span className="font-medium text-stone-700">{confirmDelete.book}</span> will be
              permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-xl border border-stone-200 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteOrder(confirmDelete.id)}
                disabled={deletingId === confirmDelete.id}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
              >
                {deletingId === confirmDelete.id ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}