'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface OcupacaoChartProps {
  data: any[];
}

export default function OcupacaoChart({ data }: OcupacaoChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="data"
          tickFormatter={(v) => {
            const d = new Date(v + 'T12:00:00');
            return `${d.getDate()}/${d.getMonth() + 1}`;
          }}
          fontSize={12}
        />
        <YAxis unit="%" domain={[0, 100]} fontSize={12} />
        <Tooltip
          labelFormatter={(v) => {
            const d = new Date(v + 'T12:00:00');
            return d.toLocaleDateString('pt-BR');
          }}
          formatter={(value) => [`${value}%`, 'Ocupação']}
        />
        <Area
          type="monotone"
          dataKey="ocupacao"
          stroke="#2563eb"
          fill="#3b82f6"
          fillOpacity={0.2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
