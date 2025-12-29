import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import dayjs from "dayjs";

const SalesLineChart = ({ invoices }: any) => {
  const data = invoices.map((i: any) => ({
    date: dayjs(i.orderDate).format("DD/MM"),
    amount: i.totalAmount
  }));

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <h3 className="font-semibold mb-2 text-gray-700">Sales Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#3B82F6"
            strokeWidth={3}
            dot={{ r: 5, fill: "#2563EB" }}
            activeDot={{ r: 6, fill: "#2563EB" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesLineChart;
