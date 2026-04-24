import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import OrdersTable from "../components/OrdersTable";

export default function OrdersPage() {
  return (
    <div className="flex min-h-screen bg-stone-50 text-stone-800">
      <Sidebar />
      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <Navbar />
        <OrdersTable />
      </div>
    </div>
  );
}