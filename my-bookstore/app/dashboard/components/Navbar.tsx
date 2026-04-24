export default function Navbar() {
  return (
    <div className="mb-6 flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-5 py-4 shadow-sm">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-stone-900">Dashboard</h2>
        <p className="text-sm text-blue-500">Track books, orders, and revenue at a glance</p>
      </div>
      <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
        Hello, User
      </div>
    </div>
  );
}