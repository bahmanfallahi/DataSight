'use client';
import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { ParsedData } from '@/lib/data-utils';
import { Users } from 'lucide-react';

interface ExpertSalesData {
  name: string;
  totalSales: number;
  fill: string;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function ExpertSalesPieChart({ parsedData }: { parsedData: ParsedData }) {
  const { chartData, totalRevenue } = useMemo(() => {
    const agentHeader = parsedData.headers.find(h => h.toLowerCase() === 'agent');
    const fiberSaleHeader = parsedData.headers.find(h => h.toLowerCase() === 'fiber sale');
    const ontSaleHeader = parsedData.headers.find(h => h.toLowerCase() === 'ont sale');

    if (!agentHeader || !fiberSaleHeader || !ontSaleHeader) {
      return { chartData: [], totalRevenue: 0 };
    }

    const salesMap: Record<string, number> = {};
    let totalRevenue = 0;

    parsedData.data.forEach(row => {
      const agent = row[agentHeader];
      if (!agent) return;

      const fiberSale = parseFloat(row[fiberSaleHeader]) || 0;
      const ontSale = parseFloat(row[ontSaleHeader]) || 0;
      const totalSale = fiberSale + ontSale;

      if (!salesMap[agent]) {
        salesMap[agent] = 0;
      }
      salesMap[agent] += totalSale;
      totalRevenue += totalSale;
    });

    const sortedSales = Object.entries(salesMap)
      .map(([name, totalSales]) => ({
        name,
        totalSales,
      }))
      .sort((a, b) => b.totalSales - a.totalSales);

    let finalData;
    if (sortedSales.length > 4) {
      const topFour = sortedSales.slice(0, 4);
      const otherTotal = sortedSales.slice(4).reduce((acc, curr) => acc + curr.totalSales, 0);
      finalData = [...topFour, { name: 'Other', totalSales: otherTotal }];
    } else {
      finalData = sortedSales;
    }

    const chartData = finalData.map((item, index) => ({
      ...item,
      fill: COLORS[index % COLORS.length],
    }));

    return { chartData, totalRevenue };
  }, [parsedData]);
  
  const chartConfig = useMemo(() => {
      const config: any = {};
      chartData.forEach(item => {
          config[item.name] = {
              label: item.name,
              color: item.fill,
          }
      });
      return config;
  }, [chartData]);


  if (chartData.length === 0) {
    return null;
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Expert Sales Share</CardTitle>
        </div>
        <CardDescription>Sales distribution by expert</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-[250px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="totalSales"
                nameKey="name"
                innerRadius={60}
                strokeWidth={5}
                labelLine={false}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
       <CardContent className="mt-4 text-sm">
        <div className="flex flex-col gap-2">
            {chartData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.fill }} />
                        <span>{item.name}</span>
                    </div>
                    <span>{((item.totalSales / totalRevenue) * 100).toFixed(1)}%</span>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
