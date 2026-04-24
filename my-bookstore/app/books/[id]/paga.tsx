"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/app/lib/api";

type Book = { id: number; title: string; author: string; price: number };

export default function BookDetailPage() {
  const { id } = useParams();
  const [book, setBook] = useState<Book | null>(null);

  useEffect(() => {
    api.get(`/books/${id}`).then((res) => setBook(res.data));
  }, [id]);

  if (!book) return <p>Loading...</p>;

  return (
    <div style={{ padding: 32 }}>
      <h1>{book.title}</h1>
      <p>Author: {book.author}</p>
      <p>Price: ₹{book.price}</p>
    </div>
  );
}