// import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// const SalesBarChart = ({ purchases }: any) => {
//   const data = purchases.map((p: any) => ({
//     reference: p.ref,
//     amount: p.grandTotal
//   }));

//   return (
//     <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition p-6 border border-gray-100">
//       <h3 className="text-lg font-semibold text-gray-800 mb-4">
//         Purchases
//       </h3>

//       <ResponsiveContainer width="100%" height={300}>
//         <BarChart data={data}>
//           <CartesianGrid strokeDasharray="3 3" />
//           <XAxis dataKey="reference" hide />
//           <YAxis />
//           <Tooltip />
//           <Bar dataKey="amount" fill="#10B981" radius={[6, 6, 0, 0]} />
//         </BarChart>
//       </ResponsiveContainer>
//     </div>
//   );
// };

// export default SalesBarChart;

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from "recharts";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isoWeek);
dayjs.extend(isBetween);

interface Props {
  purchases: any[];
  startDate: string;
  endDate: string;
  groupBy: "daily" | "weekly" | "monthly";
  setGroupBy: (v: "daily" | "weekly" | "monthly") => void;
  growth: number | null;
}

const SalesBarChart = ({
  purchases,
  startDate,
  endDate,
  groupBy,
  setGroupBy,
  growth
}: Props) => {

  const start = dayjs(startDate);
  const end = dayjs(endDate);

  const grouped = new Map<string, number>();

  // 1️ Group Data
  purchases.forEach(p => {
    const date = dayjs(p.createdAt || p.purchaseDate);

    let key = "";

    if (groupBy === "daily") {
      key = date.format("YYYY-MM-DD");
    }

    if (groupBy === "weekly") {
      key = `${date.year()}-W${date.isoWeek()}`;
    }

    if (groupBy === "monthly") {
      key = date.format("YYYY-MM");
    }

    grouped.set(
      key,
      (grouped.get(key) || 0) + Number(p.grandTotal || 0)
    );
  });

  // 2️ Auto-fill missing dates
  const data: any[] = [];

  let cursor = start.clone();

  while (cursor.isBefore(end) || cursor.isSame(end)) {

    let key = "";

    if (groupBy === "daily") {
      key = cursor.format("YYYY-MM-DD");
      data.push({
        label: cursor.format("DD/MM"),
        amount: grouped.get(key) || 0
      });
      cursor = cursor.add(1, "day");
    }

    else if (groupBy === "weekly") {
      key = `${cursor.year()}-W${cursor.isoWeek()}`;
      data.push({
        label: `W${cursor.isoWeek()}`,
        amount: grouped.get(key) || 0
      });
      cursor = cursor.add(1, "week");
    }

    else if (groupBy === "monthly") {
      key = cursor.format("YYYY-MM");
      data.push({
        label: cursor.format("MMM YYYY"),
        amount: grouped.get(key) || 0
      });
      cursor = cursor.add(1, "month");
    }
  }

  // // 3️ Previous Period Comparison
  // const periodLength = end.diff(start, "day") + 1;
  // const prevStart = start.subtract(periodLength, "day");
  // const prevEnd = start.subtract(1, "day");

  // const previousTotal = purchases
  // .filter(p => {
  //   const d = dayjs(p.createdAt || p.purchaseDate);
  //   return d.isBetween(prevStart, prevEnd, null, "[]"); // inclusive
  // })
  // .reduce((sum, p) => sum + Number(p.grandTotal || 0), 0);

  const currentTotal = data.reduce((sum, d) => sum + d.amount, 0);

  // const growth =
  //   previousTotal === 0
  //     ? 100
  //     : ((currentTotal - previousTotal) / previousTotal) * 100;

  // 4️ UI
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">

        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Purchases Overview
          </h3>
          <p className="text-sm text-gray-500">
            Total: <span className="font-semibold text-gray-800">
              {currentTotal.toLocaleString()} $
            </span>
          </p>
          <p
            className={`text-sm font-medium ${
              growth === null
                ? "text-gray-400"
                : growth >= 0
                ? "text-green-500"
                : "text-red-500"
            }`}
          >
            {growth === null
              ? "—"
              : `${growth}% vs previous period`}
          </p>
        </div>

        {/* Grouping Switch */}
        <div className="flex gap-2">
          {["daily", "weekly", "monthly"].map((g: any) => (
            <button
              key={g}
              onClick={() => setGroupBy(g)}
              className={`px-3 py-1 rounded-lg text-sm ${
                groupBy === g
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip
            formatter={(value: number | undefined) =>
              [`${(value ?? 0).toLocaleString()} $`, "Purchase"]
            }
          />
          <Legend />
          <Bar
            dataKey="amount"
            fill="#10B981"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

    </div>
  );
};

export default SalesBarChart;