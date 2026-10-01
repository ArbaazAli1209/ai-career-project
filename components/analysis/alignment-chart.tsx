"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#315b49", "#d5f274"];

export function AlignmentChart({ alignment }: { alignment: number }) {
  const data = [
    { name: "Aligned", value: alignment },
    { name: "Opportunity to grow", value: 100 - alignment },
  ];
  return (
    <div className="alignment-chart" role="img" aria-label={`Estimated skill alignment: ${alignment} percent`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="72%" outerRadius="94%" startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}>
            {data.map((entry, index) => <Cell key={entry.name} fill={COLORS[index]} />)}
          </Pie>
          <Tooltip formatter={(value) => `${value}%`} contentStyle={{ borderRadius: 3, border: "1px solid #dce2db", fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="chart-center"><strong>{alignment}<small>%</small></strong><span>alignment</span></div>
    </div>
  );
}