
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

interface TrendsChartProps {
    data: any[];
    metric: 'faturamento' | 'volume' | 'ticketMedio';
}

export default function TrendsChart({ data, metric }: TrendsChartProps) {
  const formatValue = (value: number) => {
    if (metric === 'volume') {
      return value.toLocaleString('pt-BR');
    }
    // Formats to currency, using "k" for thousands
    if (value >= 1000) {
      return `R$${(value / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`;
    }
    return `R$${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
    
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="month"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatValue}
          width={80}
        />
        <Tooltip
            cursor={{fill: 'hsl(var(--secondary))'}}
            contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))'
            }}
            formatter={(value: number) => formatValue(value)}
        />
        <Legend 
            verticalAlign="top" 
            align="right" 
            height={36}
            iconSize={10}
            wrapperStyle={{ fontSize: '12px' }}
        />
        <Bar dataKey="Ano Anterior" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Ano Atual" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
