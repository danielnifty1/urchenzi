"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AdminOverview } from "@/services/adminDashboardApi";

const COLORS = {
  customers: "#34d399",
  vendors: "#38bdf8",
  riders: "#fbbf24",
  admins: "#f472b6",
};

type Props = {
  overview: AdminOverview;
  hasAnyUsers: boolean;
};

export function AdminOverviewCharts({ overview, hasAnyUsers }: Props) {
  const roleData = [
    { name: "Customers", value: overview.customers, color: COLORS.customers },
    { name: "Vendors", value: overview.vendors, color: COLORS.vendors },
    { name: "Riders", value: overview.riders, color: COLORS.riders },
    { name: "Admins", value: overview.admins, color: COLORS.admins },
  ];

  const barData = roleData.map((d) => ({ role: d.name, count: d.value }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900/90 to-zinc-950 p-6 shadow-xl shadow-black/20">
        <h3 className="mb-1 text-sm font-medium text-zinc-400">Users by role</h3>
        <p className="mb-4 text-xs text-zinc-600">Distribution across the platform</p>
        <div className="h-[280px] w-full">
          {hasAnyUsers ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={96}
                  paddingAngle={2}
                >
                  {roleData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="#18181b" strokeWidth={1} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#18181b",
                    border: "1px solid #3f3f46",
                    borderRadius: "8px",
                    color: "#fafafa",
                  }}
                  formatter={(value) => [
                    Number(value ?? 0).toLocaleString(),
                    "Count",
                  ]}
                />
                <Legend
                  verticalAlign="bottom"
                  formatter={(value) => <span className="text-zinc-400 text-xs">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-600">
              No user counts yet — connect GET /admin/overview
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900/90 to-zinc-950 p-6 shadow-xl shadow-black/20">
        <h3 className="mb-1 text-sm font-medium text-zinc-400">Counts by role</h3>
        <p className="mb-4 text-xs text-zinc-600">Bar comparison</p>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="role" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: "8px",
                  color: "#fafafa",
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell
                    key={entry.role}
                    fill={[COLORS.customers, COLORS.vendors, COLORS.riders, COLORS.admins][index]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900/90 to-zinc-950 p-6 shadow-xl shadow-black/20 lg:col-span-2">
        <h3 className="mb-1 text-sm font-medium text-zinc-400">Activity</h3>
        <p className="mb-4 text-xs text-zinc-600">
          Signups or events over time (optional <code className="text-zinc-500">activity</code> array from API)
        </p>
        <div className="h-[260px] w-full">
          {overview.activity.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overview.activity} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="adminArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="label" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "#18181b",
                    border: "1px solid #3f3f46",
                    borderRadius: "8px",
                    color: "#fafafa",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#adminArea)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 text-sm text-zinc-600">
              No time-series data — include <code className="text-zinc-500">activity</code> or{" "}
              <code className="text-zinc-500">signupsByDay</code> in the overview response
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
