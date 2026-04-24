"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { removeToken } from "@/app/lib/auth";

export default function Navbar() {
  const router = useRouter();

  const logout = () => {
    removeToken();
    router.push("/login");
  };

  return (
    <nav className="navbar">
      <Link href="/books" className="navbar-logo">
        Folio<span>.</span>
      </Link>
      <ul className="navbar-links">
        <li><Link href="/books">Books</Link></li>
        <li><Link href="/orders">My Orders</Link></li>
      </ul>
      <button className="navbar-btn" onClick={logout}>
        Sign out
      </button>
    </nav>
  );
}