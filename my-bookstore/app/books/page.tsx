"use client";
import { useEffect, useState } from "react";
import api from "@/app/lib/api";
import Link from "next/link";

type Book = { id: number; title: string; author: string; price: number };

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    api.get("/books").then((res) => setBooks(res.data));
  }, []);

  const deleteBook = async (id: number) => {
    await api.delete(`/books/${id}`);
    setBooks(books.filter((b) => b.id !== id));
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto w-full max-w-4xl rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-800">Books</h1>
          <Link
            href="/books/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            + Add Book
          </Link>
        </div>

        <ul className="space-y-3">
          {books.map((book) => (
            <li
              key={book.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3"
            >
              <div className="text-slate-700">
                <Link
                  href={`/books/${book.id}`}
                  className="font-semibold text-slate-900 hover:text-blue-600"
                >
                  {book.title}
                </Link>
                <span className="ml-2 text-slate-500">— {book.author} — ₹{book.price}</span>
              </div>
              <button
                className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-600"
                onClick={() => deleteBook(book.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}