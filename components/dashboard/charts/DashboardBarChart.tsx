"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { VendorMonthlyPoint } from "@/types/vendorMultiStore";

type Props = {
  data: VendorMonthlyPoint[];
  dataKey?: string;
  fill?: string;
};

export function DashboardBarChart({
  data,
  dataKey = "value",
  fill = "#8b5cf6",
}: Props) {
  if (!data.length) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-xl border border-dashed border-zinc-800 text-sm text-zinc-500">
        No order data yet
      </div>
    );
  }

  return (
    <div className="h-[240px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
          <Tooltip
            contentStyle={{
              background: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#a1a1aa" }}
          />
          <Bar dataKey={dataKey} fill={fill} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
