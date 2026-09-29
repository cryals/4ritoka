"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ComparisonRow } from "./comparison-workbench";

export function ComparisonChart({ rows }: { rows: ComparisonRow[] }) {
  const data = rows.map((row) => ({
    name: row.scenario_name,
    output: row.output_units,
    throughput: Number(row.throughput.toFixed(2)),
    completion: Number((row.completion_rate * 100).toFixed(1)),
  }));
  return (
    <div className="chart-panel">
      <h3 className="chart-title">Производительность сценариев</h3>
      <p className="chart-summary">Точные значения приведены в таблице под графиком.</p>
      <ResponsiveContainer height={360} width="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="#d6d6d3" vertical={false} />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="output" fill="#0b0c0e" />
          <Bar dataKey="throughput" fill="#ffcc00" stroke="#0b0c0e" />
          <Bar dataKey="completion" fill="#84878c" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
