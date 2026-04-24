"use client";
import { useEffect, useState } from "react";
import api from "@/app/lib/api";

type Order = { id: number; bookId: number; userId: number; quantity: number };

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    api.get("/orders").then((res) => setOrders(res.data));
  }, []);

  const placeOrder = async () => {
    const order = { bookId: 1, userId: 1, quantity: 1 }; 
    const res = await api.post("/orders", order);
    setOrders([...orders, res.data]);
  };

  return (
    <div style={{ padding: 32 }}>
      <h1>Orders</h1>
      <button onClick={placeOrder}>Place Test Order</button>
      <ul>
        {orders.map((o) => (
          <li key={o.id}>Order #{o.id} — Book {o.bookId} × {o.quantity}</li>
        ))}
      </ul>
    </div>
  );
}