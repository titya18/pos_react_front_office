import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const SalesBarChart = ({ purchases }: any) => {
  const data = purchases.map((p: any) => ({
    reference: p.ref,
    amount: p.grandTotal
  }));

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <h3 className="font-semibold mb-2 text-gray-700">Purchases</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="reference" hide />
          <YAxis />
          <Tooltip />
          <Bar dataKey="amount" fill="url(#colorBar)" radius={[4, 4, 0, 0]}>
            <defs>
              <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34D399" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.6} />
              </linearGradient>
            </defs>
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesBarChart;
