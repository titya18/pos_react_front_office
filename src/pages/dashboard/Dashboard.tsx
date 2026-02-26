import { useState } from "react";
import dayjs from "dayjs";
import { useDashboardData } from "../components/dashboard/hooks/useDashboardData";
import SummaryCards from "../components/dashboard/SummaryCards";
import SalesLineChart from "../components/dashboard/SalesLineChart";
import SalesBarChart from "../components/dashboard/SalesBarChart";
import SalesPieChart from "../components/dashboard/SalesPieChart";
import Filters from "../components/dashboard/Filters";
import { useAppContext } from "@/hooks/useAppContext";

const DashboardPage = () => {
  const { user } = useAppContext();
  const [filters, setFilters] = useState({
    startDate: dayjs().startOf("month").format("YYYY-MM-DD"),
    endDate: dayjs().endOf("month").format("YYYY-MM-DD"),
    branchId: undefined as number | undefined
  });

  const data = useDashboardData(filters);
  const [groupBy, setGroupBy] = useState<"daily" | "weekly" | "monthly">("daily");

  return (
    <div className="bg-gray-50 flex items-center justify-center p-6">
      {user?.roleType === "USER" ? (
        <div className="relative" style={{ minHeight: 'calc(50vh - 2rem)' }}>

          {/* Floating background shapes container */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-0 w-96 h-96 bg-purple-300 rounded-full blur-3xl opacity-30 animate-float-slow translate-x-[-25%] translate-y-[-25%]"></div>
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-pink-300 rounded-full blur-3xl opacity-25 animate-float-slower translate-x-[20%] translate-y-[10%]"></div>
            <div className="absolute top-1/4 right-0 w-64 h-64 bg-blue-300 rounded-full blur-3xl opacity-20 animate-float translate-x-[15%]"></div>
          </div>

          {/* Card */}
          <div className="relative z-10 max-w-md w-full bg-white rounded-3xl shadow-2xl flex flex-col items-center space-y-6 transform transition-transform hover:-translate-y-2 hover:shadow-3xl" style={{ padding: '3rem 2rem' }}>
            
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 text-4xl shadow-md animate-pulse">
              ⚠️
            </div>

            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 text-center animate-fadeIn">
              Welcome to Your Dashboard
            </h1>

            <p className="text-gray-600 text-center text-base md:text-lg leading-relaxed animate-fadeIn delay-100">
              You don’t have permission to view this dashboard.
            </p>

            <div className="w-20 h-1 bg-gray-200 rounded-full mt-4 animate-fadeIn delay-300"></div>

            <style>{`
              .animate-fadeIn { opacity: 0; transform: translateY(10px); animation: fadeIn 0.5s forwards; }
              .animate-fadeIn.delay-100 { animation-delay: 0.1s; }
              .animate-fadeIn.delay-200 { animation-delay: 0.2s; }
              .animate-fadeIn.delay-300 { animation-delay: 0.3s; }

              @keyframes fadeIn {
                to { opacity: 1; transform: translateY(0); }
              }

              .animate-float { animation: float 6s ease-in-out infinite; }
              .animate-float-slow { animation: float 10s ease-in-out infinite; }
              .animate-float-slower { animation: float 15s ease-in-out infinite; }

              @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-15px); }
              }
            `}</style>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl w-full space-y-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>

          <Filters filters={filters} onChange={setFilters} />

          <SummaryCards
            invoices={data.invoices.data?.summary}
            purchases={data.purchases.data?.summary}
            payments={data.payments.data?.summary}
          />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SalesLineChart invoices={data.invoices.data?.data || []} />
            <SalesBarChart
              purchases={data.purchases.data?.data || []}
              startDate={filters.startDate}
              endDate={filters.endDate}
              groupBy={groupBy}
              setGroupBy={setGroupBy}
              growth={data.purchases.data?.growth ?? null}
            />
          </div>

          <SalesPieChart
            invoices={{ totalAmount: data.invoices.data?.summary?.totalAmount ?? 0 }}
            quotations={{ totalAmount: data.quotations.data?.summary?.totalAmount ?? 0 }}
            payments={{ totalAmount: data.payments.data?.summary?.totalPaid ?? 0 }}
            purchases={{ totalAmount: data.purchases.data?.summary?.grandTotalAmount ?? 0 }}
          />
        </div>
      )}
    </div>
  );
};

export default DashboardPage;