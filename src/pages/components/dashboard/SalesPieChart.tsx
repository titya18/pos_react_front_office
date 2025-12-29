import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from "recharts";

const SalesPieChart = ({ invoices, quotations }: any) => {
  const data = [
    { name: "Invoices", value: invoices?.totalAmount || 0 },
    { name: "Quotations", value: quotations?.totalAmount || 0 }
  ];

  const colors = ["#3b82f6", "#f59e0b"];

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-semibold mb-2 text-gray-700">Sales Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Tooltip />
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={100} label>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesPieChart;
