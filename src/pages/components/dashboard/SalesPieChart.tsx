import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";

const SalesPieChart = ({ invoices, quotations }: any) => {

  const data = [
    { name: "Invoices", value: invoices?.totalAmount || 0 },
    { name: "Quotations", value: quotations?.totalAmount || 0 }
  ];

  const colors = ["#3B82F6", "#F59E0B"];

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Sales Distribution
      </h3>

      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Tooltip />
          <Legend />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            outerRadius={130}
            innerRadius={70}
            label
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesPieChart;