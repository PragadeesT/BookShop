"use client";

import { useEffect, useState } from "react";
import axios from "axios";

// ── Axios instance with JWT ──────────────────────────────────────────────────
const api = axios.create({ baseURL: "http://localhost:8080" });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Types ────────────────────────────────────────────────────────────────────
type Book = {
  id: number;
  title: string;
  author: string;
  price: number;
  category: string;
  stock: number;
};

type FormData = {
  title: string;
  author: string;
  price: string;
  category: string;
  stock: string;
};

const emptyForm: FormData = {
  title: "", author: "", price: "", category: "", stock: "",
};

// ── Component ────────────────────────────────────────────────────────────────
export default function BookTable() {
  const [books, setBooks]         = useState<Book[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editBook, setEditBook]   = useState<Book | null>(null); // null = Add mode
  const [form, setForm]           = useState<FormData>(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [deleteId, setDeleteId]   = useState<number | null>(null);

  // ── Fetch all books ────────────────────────────────────────────────────────
  const fetchBooks = () => {
    setLoading(true);
    api.get("/books")
      .then((res) => setBooks(res.data))
      .catch((err) => console.error("Failed to fetch books:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBooks(); }, []);

  // ── Open Add modal ─────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditBook(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  };

  // ── Open Edit modal ────────────────────────────────────────────────────────
  const openEdit = (book: Book) => {
    setEditBook(book);
    setForm({
      title:    book.title,
      author:   book.author,
      price:    String(book.price),
      category: book.category || "",
      stock:    String(book.stock || 0),
    });
    setError("");
    setShowModal(true);
  };

  // ── Save (Add or Edit) ─────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.title.trim())  { setError("Title is required");  return; }
    if (!form.author.trim()) { setError("Author is required"); return; }
    if (!form.price || isNaN(Number(form.price))) { setError("Valid price is required"); return; }

    setSaving(true);
    setError("");

    const payload = {
      title:    form.title.trim(),
      author:   form.author.trim(),
      price:    parseFloat(form.price),
      category: form.category.trim(),
      stock:    parseInt(form.stock) || 0,
    };

    try {
      if (editBook) {
        // UPDATE existing book
        await api.put(`/books/${editBook.id}`, payload);
      } else {
        // CREATE new book
        await api.post("/books", payload);
      }
      setShowModal(false);
      fetchBooks(); // refresh table
    } catch (err) {
      console.error(err);
      setError("Failed to save book. Check backend connection.");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    setDeleteId(id);
    try {
      await api.delete(`/books/${id}`);
      setBooks((prev) => prev.filter((b) => b.id !== id));
    } catch {
      alert("Failed to delete book.");
    } finally {
      setDeleteId(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Book Table ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-stone-900">Books</h2>
          <button
            onClick={openAdd}
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
          >
            + Add Book
          </button>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-stone-400">Loading books…</p>
        ) : books.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-400">
            No books yet.{" "}
            <button onClick={openAdd} className="text-blue-700 underline">Add your first book</button>
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500">
                <th className="pb-2 font-medium">#</th>
                <th className="pb-2 font-medium">Title</th>
                <th className="pb-2 font-medium">Author</th>
                <th className="pb-2 font-medium">Category</th>
                <th className="pb-2 font-medium">Stock</th>
                <th className="pb-2 font-medium">Price</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book, index) => (
                <tr key={book.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                  <td className="py-3 text-stone-500">{index + 1}</td>
                  <td className="py-3 font-medium text-stone-800">{book.title}</td>
                  <td className="py-3 text-stone-600">{book.author}</td>
                  <td className="py-3 text-stone-500">
                    {book.category ? (
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs">{book.category}</span>
                    ) : "—"}
                  </td>
                  <td className="py-3 text-stone-600">{book.stock ?? 0}</td>
                  <td className="py-3 font-semibold text-stone-800">₹{book.price}</td>
                  <td className="py-3 flex items-center gap-3">
                    <button
                      onClick={() => openEdit(book)}
                      className="text-sm font-medium text-blue-700 hover:text-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(book.id)}
                      disabled={deleteId === book.id}
                      className="text-sm font-medium text-red-600 hover:text-red-500 disabled:opacity-40"
                    >
                      {deleteId === book.id ? "Deleting…" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal ──────────────────────────────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in">

            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-stone-900">
                {editBook ? "Edit Book" : "Add New Book"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-stone-400 hover:text-stone-700 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Form fields */}
            <div className="space-y-4">

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Atomic Habits"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Author <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. James Clear"
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="299"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Stock
                  </label>
                  <input
                    type="number"
                    placeholder="50"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select category</option>
                  <option value="Self Help">Self Help</option>
                  <option value="Fiction">Fiction</option>
                  <option value="Non-Fiction">Non-Fiction</option>
                  <option value="Finance">Finance</option>
                  <option value="Technology">Technology</option>
                  <option value="Biography">Biography</option>
                  <option value="Science">Science</option>
                  <option value="History">History</option>
                </select>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-60"
              >
                {saving ? "Saving…" : editBook ? "Update Book" : "Add Book"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}