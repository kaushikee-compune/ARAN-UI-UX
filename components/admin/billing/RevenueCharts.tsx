"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import React from "react";

export type MonthlyPoint = { month: string; amount: number };
export type ModePoint = { mode: string; value: number };

type Props = {
  monthly: MonthlyPoint[];
  modes: ModePoint[];
};

const COLORS = ["#0284C7", "#10B981", "#F59E0B", "#EF4444"];

export default function RevenueCharts({ monthly, modes }: Props) {
  return (
    <div className="grid lg:grid-cols-2 gap-4 mt-6">
      {/* ================= Monthly Trend ================= */}
      <div className="ui-card p-4 border">
        <div className="text-sm font-semibold mb-2">Monthly Revenue</div>

        <div className="w-full h-56">
          <ResponsiveContainer>
            <LineChart data={monthly}>
              <XAxis dataKey="month" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#0284C7"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ================= Payment Mode Split ================= */}
      <div className="ui-card p-4 border">
        <div className="text-sm font-semibold mb-2">
          Payment Mode Distribution
        </div>

        <div className="w-full h-56">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={modes}
                dataKey="value"
                nameKey="mode"
                cx="50%"
                cy="50%"
                outerRadius={75}
                label={(e) => `${e.mode}: ₹${e.value}`}
              >
                {modes.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
