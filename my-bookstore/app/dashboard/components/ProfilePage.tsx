"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

// ── Axios instance ─────────────────────────────────────────────────────────
const api = axios.create({ baseURL: "http://localhost:8080" });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Types ──────────────────────────────────────────────────────────────────
type Profile = {
  id: number;
  username: string;
  email: string;
  role: string;
  totalOrders: number;
  totalSpent: number;
  delivered: number;
  recentOrders: {
    id: number;
    book: string;
    amount: string;
    status: string;
    createdAt: string;
  }[];
};

type Section = "info" | "password" | "email";

// ── Helpers ────────────────────────────────────────────────────────────────
const statusStyle: Record<string, string> = {
  Delivered: "bg-emerald-100 text-emerald-700",
  Pending:   "bg-amber-100  text-amber-700",
  Shipped:   "bg-sky-100    text-sky-700",
  Cancelled: "bg-red-100    text-red-600",
};

const roleStyle: Record<string, string> = {
  ADMIN: "bg-amber-100 text-amber-800 border border-amber-200",
  USER:  "bg-stone-100 text-stone-600 border border-stone-200",
};

function Avatar({ name, size = "lg" }: { name: string; size?: "sm" | "lg" }) {
  const initials = name.slice(0, 2).toUpperCase();
  const colors   = ["bg-violet-500","bg-teal-500","bg-rose-500","bg-amber-500","bg-sky-500","bg-emerald-500"];
  const color    = colors[name.charCodeAt(0) % colors.length];
  const dim      = size === "lg" ? "h-20 w-20 text-2xl" : "h-10 w-10 text-sm";
  return (
    <span className={`inline-flex items-center justify-center rounded-full font-bold text-white ${color} ${dim}`}>
      {initials}
    </span>
  );
}

function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium shadow-lg transition-all ${
      type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
    }`}>
      <span>{type === "success" ? "✓" : "✕"}</span>
      {msg}
    </div>
  );
}

function FieldInput({
  label, type = "text", value, onChange, error, placeholder, hint
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; error?: string;
  placeholder?: string; hint?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-400">
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-xl border px-4 py-2.5 text-sm text-stone-800 outline-none transition
          focus:ring-2 focus:ring-blue-100 ${
          error
            ? "border-red-300 focus:border-red-400"
            : "border-stone-200 focus:border-blue-400"
        }`}
      />
      {hint  && !error && <p className="mt-1.5 text-xs text-stone-400">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Strength ───────────────────────────────────────────────────────────────
function passwordStrength(pw: string) {
  let s = 0;
  if (pw.length >= 8)           s++;
  if (/[A-Z]/.test(pw))         s++;
  if (/[0-9]/.test(pw))         s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const levels = [
    { label: "Weak",   color: "bg-red-400",   text: "text-red-500"   },
    { label: "Fair",   color: "bg-amber-400",  text: "text-amber-600" },
    { label: "Good",   color: "bg-yellow-400", text: "text-yellow-600"},
    { label: "Strong", color: "bg-emerald-500",text: "text-emerald-600"},
  ];
  return { score: s, ...(levels[s - 1] ?? { label: "", color: "bg-stone-200", text: "" }) };
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile]     = useState<Profile | null>(null);
  const [loading, setLoading]     = useState(true);
  const [activeSection, setActiveSection] = useState<Section>("info");
  const [toast, setToast]         = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // password form
  const [pwForm, setPwForm]       = useState({ current: "", newPw: "", confirm: "" });
  const [pwErrors, setPwErrors]   = useState<Record<string, string>>({});
  const [pwLoading, setPwLoading] = useState(false);

  // email form
  const [emailVal, setEmailVal]   = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // ── Fetch profile ──────────────────────────────────────────────────────
  useEffect(() => {
    api.get("/users/me")
      .then((r) => {
        setProfile(r.data);
        setEmailVal(r.data.email);
      })
      .catch((err) => {
        if (err.response?.status === 401) router.push("/login");
        else showToast("Failed to load profile", "error");
      })
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Logout ─────────────────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem("token");
    document.cookie = "token=; path=/; max-age=0";
    router.push("/login");
  };

  // ── Change password ────────────────────────────────────────────────────
  const handlePasswordChange = async () => {
    const errs: Record<string, string> = {};
    if (!pwForm.current)          errs.current = "Required";
    if (!pwForm.newPw)            errs.newPw   = "Required";
    else if (pwForm.newPw.length < 6) errs.newPw = "At least 6 characters";
    if (pwForm.newPw !== pwForm.confirm) errs.confirm = "Passwords do not match";
    if (Object.keys(errs).length) { setPwErrors(errs); return; }

    setPwLoading(true);
    try {
      await api.patch("/users/me/password", {
        currentPassword: pwForm.current,
        newPassword:     pwForm.newPw,
      });
      setPwForm({ current: "", newPw: "", confirm: "" });
      setPwErrors({});
      showToast("Password updated successfully", "success");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? "Failed to update password";
      setPwErrors({ current: msg });
    } finally {
      setPwLoading(false);
    }
  };

  // ── Update email ───────────────────────────────────────────────────────
  const handleEmailUpdate = async () => {
    if (!emailVal || !emailVal.includes("@")) {
      setEmailError("Enter a valid email address"); return;
    }
    setEmailLoading(true);
    try {
      await api.patch("/users/me/email", { email: emailVal });
      setProfile((p) => p ? { ...p, email: emailVal } : p);
      setEmailError("");
      showToast("Email updated successfully", "success");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? "Failed to update email";
      setEmailError(msg);
    } finally {
      setEmailLoading(false);
    }
  };

  const strength = passwordStrength(pwForm.newPw);

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-blue-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-20 text-center text-stone-400 text-sm">
        Could not load profile.{" "}
        <button onClick={() => router.push("/login")} className="text-blue-600 underline">
          Sign in again
        </button>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* ── Profile Hero Card ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">

        {/* Decorative top bar */}
        <div className="h-24 w-full bg-gradient-to-r from-stone-800 via-stone-700 to-stone-900" />

        <div className="px-6 pb-6">
          {/* Avatar overlapping the bar */}
          <div className="-mt-10 mb-4 flex items-end justify-between">
            <div className="ring-4 ring-white rounded-full">
              <Avatar name={profile.username} size="lg" />
            </div>
            <button
              onClick={logout}
              className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 transition"
            >
              Sign out
            </button>
          </div>

          {/* Name + role */}
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-stone-900">{profile.username}</h2>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleStyle[profile.role] ?? roleStyle.USER}`}>
              {profile.role}
            </span>
          </div>
          <p className="mt-1 text-sm text-stone-400">{profile.email}</p>

          {/* Stats row */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              { label: "Total orders",  value: profile.totalOrders },
              { label: "Total spent",   value: `₹${Math.round(profile.totalSpent)}` },
              { label: "Delivered",     value: profile.delivered },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-stone-100 bg-stone-50 p-3 text-center">
                <p className="text-xl font-bold text-stone-900">{s.value}</p>
                <p className="text-xs text-stone-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Two-column layout ────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* ── Left: settings panel ───────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Section tabs */}
          <div className="flex gap-1 rounded-xl border border-stone-200 bg-white p-1 shadow-sm">
            {([
              { key: "info",     label: "Account info" },
              { key: "email",    label: "Update email" },
              { key: "password", label: "Change password" },
            ] as { key: Section; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                  activeSection === key
                    ? "bg-stone-900 text-white shadow"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Account info ─────────────────────────────────────────────── */}
          {activeSection === "info" && (
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="font-semibold text-stone-900">Account information</h3>
              <div className="divide-y divide-stone-100">
                {[
                  { label: "User ID",  value: `#${profile.id}` },
                  { label: "Username", value: profile.username  },
                  { label: "Email",    value: profile.email     },
                  { label: "Role",     value: profile.role      },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-3">
                    <span className="text-sm text-stone-400">{label}</span>
                    <span className="text-sm font-medium text-stone-800">{value}</span>
                  </div>
                ))}
              </div>

              {/* Info note */}
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-xs text-blue-700">
                  To update your username, contact an administrator. You can update your email and password using the tabs above.
                </p>
              </div>
            </div>
          )}

          {/* ── Update email ──────────────────────────────────────────────── */}
          {activeSection === "email" && (
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-5">
              <div>
                <h3 className="font-semibold text-stone-900">Update email</h3>
                <p className="mt-1 text-sm text-stone-400">
                  Current: <span className="font-medium text-stone-700">{profile.email}</span>
                </p>
              </div>

              <FieldInput
                label="New email address"
                type="email"
                value={emailVal}
                onChange={(v) => { setEmailVal(v); setEmailError(""); }}
                error={emailError}
                placeholder="you@example.com"
              />

              <button
                onClick={handleEmailUpdate}
                disabled={emailLoading}
                className="w-full rounded-xl bg-stone-900 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 transition disabled:opacity-60"
              >
                {emailLoading ? "Saving…" : "Update email"}
              </button>
            </div>
          )}

          {/* ── Change password ───────────────────────────────────────────── */}
          {activeSection === "password" && (
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-5">
              <div>
                <h3 className="font-semibold text-stone-900">Change password</h3>
                <p className="mt-1 text-sm text-stone-400">
                  Use a strong password with letters, numbers and symbols.
                </p>
              </div>

              <FieldInput
                label="Current password"
                type="password"
                value={pwForm.current}
                onChange={(v) => { setPwForm((f) => ({ ...f, current: v })); setPwErrors((e) => ({ ...e, current: "" })); }}
                error={pwErrors.current}
                placeholder="Your current password"
              />

              <div>
                <FieldInput
                  label="New password"
                  type="password"
                  value={pwForm.newPw}
                  onChange={(v) => { setPwForm((f) => ({ ...f, newPw: v })); setPwErrors((e) => ({ ...e, newPw: "" })); }}
                  error={pwErrors.newPw}
                  placeholder="Min. 6 characters"
                />
                {/* Strength bar */}
                {pwForm.newPw && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1,2,3,4].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all ${
                            i <= strength.score ? strength.color : "bg-stone-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${strength.text}`}>
                      {strength.label}
                    </p>
                  </div>
                )}
              </div>

              <FieldInput
                label="Confirm new password"
                type="password"
                value={pwForm.confirm}
                onChange={(v) => { setPwForm((f) => ({ ...f, confirm: v })); setPwErrors((e) => ({ ...e, confirm: "" })); }}
                error={pwErrors.confirm}
                placeholder="Repeat new password"
              />

              {/* Requirements checklist */}
              <div className="rounded-xl border border-stone-100 bg-stone-50 p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Requirements</p>
                {[
                  { label: "At least 6 characters",           met: pwForm.newPw.length >= 6          },
                  { label: "Contains uppercase letter",        met: /[A-Z]/.test(pwForm.newPw)         },
                  { label: "Contains a number",                met: /[0-9]/.test(pwForm.newPw)         },
                  { label: "Contains special character",       met: /[^A-Za-z0-9]/.test(pwForm.newPw) },
                  { label: "Passwords match",                  met: pwForm.newPw.length > 0 && pwForm.newPw === pwForm.confirm },
                ].map(({ label, met }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className={`text-sm ${met ? "text-emerald-600" : "text-stone-300"}`}>
                      {met ? "✓" : "○"}
                    </span>
                    <span className={`text-xs ${met ? "text-stone-600" : "text-stone-400"}`}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={handlePasswordChange}
                disabled={pwLoading}
                className="w-full rounded-xl bg-stone-900 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 transition disabled:opacity-60"
              >
                {pwLoading ? "Updating…" : "Update password"}
              </button>
            </div>
          )}
        </div>

        {/* ── Right: recent orders ──────────────────────────────────────── */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-stone-900">Recent orders</h3>

          {profile.recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone-400">No orders yet</p>
          ) : (
            <ul className="space-y-3">
              {profile.recentOrders.map((order) => (
                <li key={order.id} className="rounded-xl border border-stone-100 bg-stone-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-stone-800 leading-snug">{order.book}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      statusStyle[order.status] ?? "bg-stone-100 text-stone-500"
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-xs text-stone-400">#{order.id} · {order.createdAt}</span>
                    <span className="text-sm font-semibold text-stone-700">{order.amount}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}