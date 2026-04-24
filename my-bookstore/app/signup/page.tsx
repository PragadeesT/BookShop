"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/app/lib/api";
import { saveToken } from "@/app/lib/auth";

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "#d4cfc5" };
  let score = 0;
  if (password.length >= 8)          score++;
  if (/[A-Z]/.test(password))        score++;
  if (/[0-9]/.test(password))        score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { score: 1, label: "Weak",   color: "#c0392b" },
    { score: 2, label: "Fair",   color: "#e67e22" },
    { score: 3, label: "Good",   color: "#f1c40f" },
    { score: 4, label: "Strong", color: "#2d7a4f" },
  ];
  return levels[score - 1] || { score: 0, label: "", color: "#d4cfc5" };
}

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError]   = useState("");
  const [apiSuccess, setApiSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(form.password);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.username.trim())              e.username = "Username is required";
    else if (form.username.length < 3)      e.username = "At least 3 characters";
    if (!form.email.trim())                 e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email address";
    if (!form.password)                     e.password = "Password is required";
    else if (form.password.length < 6)      e.password = "At least 6 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    return e;
  };

  const handleChange = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
    setApiError("");
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    setLoading(true);
    setApiError("");

    try {
      const res = await api.post("/auth/signup", {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      saveToken(res.data.token);
      setApiSuccess("Account created! Redirecting…");
      setTimeout(() => router.push("/books"), 1200);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Something went wrong. Please try again.";
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 lg:grid lg:grid-cols-2">
      {/* ── Left Panel ── */}
      <div className="relative hidden overflow-hidden bg-stone-900 px-10 py-12 text-stone-100 lg:flex lg:flex-col lg:justify-between">
        <div className="text-3xl font-semibold tracking-wide text-white">
          Folio<span className="text-amber-300">.</span>
        </div>

        {/* Decorative book spines */}
        <div className="mt-10 flex items-end gap-2" aria-hidden>
          {["#c0392b","#c9a84c","#2d7a4f","#3d5a80","#8e44ad","#c0392b","#c9a84c"].map((c, i) => (
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
            &ldquo;A reader lives a thousand lives before he dies.&rdquo;
          </blockquote>
          <cite className="mt-3 block text-sm text-stone-300">— Pragadeeswaran T</cite>
        </div>
      </div>

      <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl shadow-stone-200/60 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Join Folio</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-stone-900">Create your account</h1>
          <p className="mt-2 text-sm text-stone-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-emerald-700 hover:text-emerald-600 hover:underline">
              Sign in
            </Link>
          </p>

          {apiError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {apiError}
            </div>
          )}
          {apiSuccess && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {apiSuccess}
            </div>
          )}

          {/* Username */}
          <div className="mt-6 space-y-1.5">
            <label htmlFor="username" className="text-sm font-medium text-stone-700">Username</label>
            <input
              id="username"
              type="text"
              placeholder="e.g. bookworm42"
              value={form.username}
              className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:ring-2 ${
                errors.username
                  ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                  : "border-stone-300 focus:border-emerald-500 focus:ring-emerald-100"
              }`}
              onChange={(e) => handleChange("username", e.target.value)}
              autoComplete="username"
            />
            {errors.username && <p className="text-xs text-red-600">{errors.username}</p>}
          </div>

          {/* Email */}
          <div className="mt-4 space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-stone-700">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:ring-2 ${
                errors.email
                  ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                  : "border-stone-300 focus:border-emerald-500 focus:ring-emerald-100"
              }`}
              onChange={(e) => handleChange("email", e.target.value)}
              autoComplete="email"
            />
            {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="mt-4 space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-stone-700">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Min. 6 characters"
              value={form.password}
              className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:ring-2 ${
                errors.password
                  ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                  : "border-stone-300 focus:border-emerald-500 focus:ring-emerald-100"
              }`}
              onChange={(e) => handleChange("password", e.target.value)}
              autoComplete="new-password"
            />
            {form.password && (
              <>
                <div className="h-2 overflow-hidden rounded-full bg-stone-200">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${(strength.score / 4) * 100}%`,
                      backgroundColor: strength.color,
                    }}
                  />
                </div>
                <p className="text-xs text-stone-600">
                  Password strength:{" "}
                  <span style={{ color: strength.color, fontWeight: 500 }}>
                    {strength.label}
                  </span>
                </p>
              </>
            )}
            {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className="mt-4 space-y-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-stone-700">Confirm password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Repeat your password"
              value={form.confirmPassword}
              className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:ring-2 ${
                errors.confirmPassword
                  ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                  : "border-stone-300 focus:border-emerald-500 focus:ring-emerald-100"
              }`}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="my-6 h-px bg-stone-200" />

          <button
            className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-70"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading && (
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {loading ? "Creating account…" : "Create account"}
          </button>
        </div>
      </div>
    </div>
  );
}