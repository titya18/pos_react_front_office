import { useState } from "react";
import dayjs from "dayjs";
import { useDashboardData } from "../components/dashboard/hooks/useDashboardData";
import SummaryCards from "../components/dashboard/SummaryCards";
import SalesLineChart from "../components/dashboard/SalesLineChart";
import SalesBarChart from "../components/dashboard/SalesBarChart";
import SalesPieChart from "../components/dashboard/SalesPieChart";
import Filters from "../components/dashboard/Filters";

const DashboardPage = () => {
  const [filters, setFilters] = useState({
    startDate: dayjs().startOf("month").format("YYYY-MM-DD"),
    endDate: dayjs().endOf("month").format("YYYY-MM-DD"),
    branchId: undefined as number | undefined
  });

  const data = useDashboardData(filters);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        <h1 className="text-2xl font-bold text-gray-800">
          Dashboard Overview
        </h1>

        <Filters filters={filters} onChange={setFilters} />

        <SummaryCards
          invoices={data.invoices.data?.summary}
          purchases={data.purchases.data?.summary}
          payments={data.payments.data?.summary}
        />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SalesLineChart invoices={data.invoices.data?.data || []} />
          <SalesBarChart purchases={data.purchases.data?.data || []} />
        </div>

        <SalesPieChart
          invoices={data.invoices.data?.summary}
          quotations={data.quotations.data?.summary}
        />

      </div>
    </div>
  );
};

export default DashboardPage;