"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAxiosError } from "axios";
import api from "@/app/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", form);
      const token = res.data.token;

      localStorage.setItem("token", token);
      document.cookie = `token=${token}; path=/`;

      router.push("/dashboard");
    } catch (err: unknown) {
      if (isAxiosError(err) && typeof err.response?.data === "string") {
        setError(err.response.data);
      } else {
        setError("Invalid username or password");
      }
    }finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-50 text-stone-800 lg:grid lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-stone-900 px-10 py-12 text-stone-100 lg:flex lg:flex-col lg:justify-between">
        <div className="text-3xl font-semibold tracking-wide text-white">
          Folio<span className="text-amber-300">.</span>
        </div>

        <div className="mt-10 flex items-end gap-2" aria-hidden>
          {["#c0392b", "#c9a84c", "#2d7a4f", "#3d5a80", "#8e44ad", "#c0392b", "#c9a84c"].map((c, i) => (
            <div
              key={i}
              className="shrink-0 shadow-md shadow-black/30"
              style={{
                height: `${140 + Math.sin(i * 1.5) * 40}px`,
                background: c,
                width: 26,
                borderRadius: 2,
              }}
            />
          ))}
        </div>

        <div className="mt-8 max-w-md text-stone-200">
          <blockquote className="text-lg italic leading-relaxed">
            &ldquo;Books are a uniquely portable magic.&rdquo;
          </blockquote>
          <cite className="mt-3 block text-sm text-stone-300">— Stephen King</cite>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl shadow-stone-200/60 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Welcome back</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-stone-900">Sign in to your account</h1>
          <p className="mt-2 text-sm text-stone-600">
            New to Folio?{" "}
            <Link href="/signup" className="font-medium text-emerald-700 hover:text-emerald-600 hover:underline">
              Create an account
            </Link>
          </p>

          <div className="mt-6 space-y-1.5">
            <label htmlFor="username" className="text-sm font-medium text-stone-700">Username</label>
            <input
              id="username"
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              placeholder="Enter your username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              autoComplete="username"
            />
          </div>

          <div className="mt-4 space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-stone-700">Password</label>
            <input
              id="password"
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="my-6 h-px bg-stone-200" />

          <button
            className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-70"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading && (
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </section>
    </main>
  );
}