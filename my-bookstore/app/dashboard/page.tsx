import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Cards from "./components/Cards";
import DashboardOverview from "./components/DashboardOverview";
import BookTable from "./components/BookTable";

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-stone-50 text-stone-800">
      <Sidebar />
      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <Navbar />
        <Cards />
        <DashboardOverview />
        <div className="mt-6">
          <BookTable />
        </div>
      </div>
    </div>
  );
}
