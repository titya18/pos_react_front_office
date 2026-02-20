import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const SalesBarChart = ({ purchases }: any) => {
  const data = purchases.map((p: any) => ({
    reference: p.ref,
    amount: p.grandTotal
  }));

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Purchases
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="reference" hide />
          <YAxis />
          <Tooltip />
          <Bar dataKey="amount" fill="#10B981" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesBarChart;