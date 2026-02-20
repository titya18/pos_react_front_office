import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import dayjs from "dayjs";

const SalesLineChart = ({ invoices }: any) => {
  const data = invoices.map((i: any) => ({
    date: dayjs(i.orderDate).format("DD/MM"),
    amount: i.totalAmount
  }));

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Sales Trend
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#3B82F6"
            strokeWidth={3}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesLineChart;