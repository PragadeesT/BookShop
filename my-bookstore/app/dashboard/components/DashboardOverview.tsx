"use client";
import { useEffect, useState } from "react";
import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8080" });
api.interceptors.request.use(c => {
  const token = localStorage.getItem("token");
  if (token) c.headers.Authorization = `Bearer ${token}`;
  return c;
});

type Order = { id: number; book: string; user: string; amount: string; status: string };
type TopBook = { title: string; sales: number };

const statusColor: Record<string, string> = {
  Delivered: "bg-emerald-100 text-emerald-700",
  Pending:   "bg-amber-100 text-amber-700",
  Shipped:   "bg-sky-100 text-sky-700",
  Cancelled: "bg-red-100 text-red-700",
};

export default function DashboardOverview() {
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [topBooks, setTopBooks]         = useState<TopBook[]>([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/dashboard/recent-orders"),
      api.get("/dashboard/top-books"),
    ])
      .then(([ordersRes, booksRes]) => {
        setRecentOrders(ordersRes.data);
        setTopBooks(booksRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const maxSales = topBooks[0]?.sales || 1;

  return (
    <div className="grid gap-6 xl:grid-cols-3">

      {/* Recent Orders */}
      <div className="xl:col-span-2 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-stone-900">Recent Orders</h2>
          <a href="/orders" className="text-sm font-medium text-blue-700 hover:underline">View all</a>
        </div>

        {loading ? (
          <p className="text-sm text-stone-400 py-6 text-center">Loading…</p>
        ) : recentOrders.length === 0 ? (
          <p className="text-sm text-stone-400 py-6 text-center">No orders yet</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500">
                <th className="pb-2 font-medium">Id</th>
                <th className="pb-2 font-medium">Book</th>
                <th className="pb-2 font-medium">User</th>
                <th className="pb-2 font-medium">Amount</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-stone-100 last:border-0">
                  <td className="py-3 font-medium text-stone-700">{order.id}</td>
                  <td className="py-3 font-medium text-stone-700">{order.book}</td>
                  <td className="py-3 text-stone-700">{order.user}</td>
                  <td className="py-3 font-semibold text-stone-700">{order.amount}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[order.status] || "bg-stone-100 text-stone-600"}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Top Selling Books */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-stone-900">Top Books</h2>
          <a href="/books" className="text-sm font-medium text-blue-700 hover:underline">View all</a>
        </div>

        {loading ? (
          <p className="text-sm text-stone-400 py-6 text-center">Loading…</p>
        ) : topBooks.length === 0 ? (
          <p className="text-sm text-stone-400 py-6 text-center">No data yet</p>
        ) : (
          <ul className="space-y-4">
            {topBooks.map((book, index) => (
              <li key={index}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-stone-700">{book.title}</span>
                  </div>
                  <span className="text-sm text-stone-500">{book.sales} sold</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-stone-100">
                  <div
                    className="h-1.5 rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${(book.sales / maxSales) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 border-t border-stone-200 pt-4">
          <p className="mb-1 text-sm text-stone-500">Monthly Target</p>
          <div className="h-2 w-full rounded-full bg-stone-200">
            <div className="h-2 rounded-full bg-emerald-600" style={{ width: "72%" }} />
          </div>
          <p className="mt-1 text-xs text-stone-400">72% achieved</p>
        </div>
      </div>

    </div>
  );
}