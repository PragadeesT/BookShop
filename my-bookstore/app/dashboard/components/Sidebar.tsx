"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/dashboard",       icon: "▦" },
  { label: "Books",     href: "/dashboard/books",  icon: "◫" },
  { label: "Orders",    href: "/dashboard/orders", icon: "◈" },
  { label: "Users",     href: "/dashboard/users",  icon: "◎" },
  { label: "Profile",   href: "/dashboard/profile",icon: "◉" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 overflow-y-auto border-r border-stone-700/40 bg-stone-900 px-5 py-6 text-stone-100 lg:block">
      <h1 className="text-2xl font-bold tracking-tight">
        Book<span className="text-amber-300">Store</span>
      </h1>
      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-400">Admin Panel</p>

      <ul className="mt-8 space-y-1">
        {navItems.map(({ label, href, icon }) => {
          const active = pathname === href;
          return (
            <li key={label}>
              <Link
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-emerald-700/25 text-emerald-200"
                    : "text-stone-300 hover:bg-stone-800 hover:text-white"
                }`}
              >
                <span className="text-base">{icon}</span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}