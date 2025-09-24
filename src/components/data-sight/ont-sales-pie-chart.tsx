'use client';
import { useMemo, useRef } from 'react';
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
import { Package } from 'lucide-react';
import ChartDownloader from './chart-downloader';

interface OntSalesData {
  name: string;
  count: number;
  fill: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#ec4899'];

export default function OntSalesPieChart({ parsedData }: { parsedData: ParsedData }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const { chartData, totalCount } = useMemo(() => {
    const ontSaleHeader = parsedData.headers.find(h => h.toLowerCase() === 'ont sale');

    if (!ontSaleHeader) {
      return { chartData: [], totalCount: 0 };
    }

    const countMap: Record<string, number> = {};
    let totalCount = 0;

    parsedData.data.forEach(row => {
      const ontSaleValue = row[ontSaleHeader];
      if (ontSaleValue === null || ontSaleValue === undefined || ontSaleValue === '' || ontSaleValue === 0 || ontSaleValue === '0') return;
      
      const ontCategory = String(ontSaleValue);

      if (!countMap[ontCategory]) {
        countMap[ontCategory] = 0;
      }
      countMap[ontCategory]++;
      totalCount++;
    });

    const sortedSales = Object.entries(countMap)
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    let finalData;
    if (sortedSales.length > 6) {
        const topSix = sortedSales.slice(0, 6);
        const otherTotal = sortedSales.slice(6).reduce((acc, curr) => acc + curr.count, 0);
        finalData = [...topSix, { name: 'Other', count: otherTotal }];
    } else {
        finalData = sortedSales;
    }

    const chartData: OntSalesData[] = finalData.map((item, index) => ({
      ...item,
      fill: COLORS[index % COLORS.length],
    }));

    return { chartData, totalCount };
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
    <Card className="flex flex-col" ref={chartRef}>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
            <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                <CardTitle>ONT Sales Share</CardTitle>
            </div>
            <CardDescription>Distribution of ONT sale types</CardDescription>
        </div>
        <ChartDownloader chartRef={chartRef} />
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
                content={<ChartTooltipContent 
                    hideLabel 
                    formatter={(value, name) => [`${value} (${((Number(value) / totalCount) * 100).toFixed(1)}%)`, name]}
                />}
              />
              <Pie
                data={chartData}
                dataKey="count"
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
                        <span>ONT: {item.name}</span>
                    </div>
                    <span>{((item.count / totalCount) * 100).toFixed(1)}%</span>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
