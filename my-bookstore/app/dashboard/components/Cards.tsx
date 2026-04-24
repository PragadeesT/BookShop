"use client";
import { useEffect, useState } from "react";
import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8080" });
api.interceptors.request.use(c => {
  const token = localStorage.getItem("token");
  if (token) c.headers.Authorization = `Bearer ${token}`;
  return c;
});

type Stats = {
  totalBooks: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
};

export default function Cards() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get("/dashboard/stats").then(r => setStats(r.data)).catch(console.error);
  }, []);

  const data = [
    { title: "Total Books",  value: stats ? stats.totalBooks              : "…" },
    { title: "Total Orders", value: stats ? stats.totalOrders             : "…" },
    { title: "Total Users",  value: stats ? stats.totalUsers              : "…" },
    { title: "Revenue",      value: stats ? `₹${Math.round(stats.totalRevenue)}` : "…" },
  ];

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {data.map((item, index) => (
        <div
          key={index}
          className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <h3 className="text-sm text-stone-500">{item.title}</h3>
          <p className="mt-1 text-2xl font-bold text-stone-900">{item.value}</p>
          <p className="mt-2 text-xs text-blue-700">Live from database</p>
        </div>
      ))}
    </div>
  );
}