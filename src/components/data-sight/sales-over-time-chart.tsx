'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import type { ParsedData } from '@/lib/data-utils';
import { parse as parseJalali } from 'date-fns-jalali';
import { TrendingUp } from 'lucide-react';

const formatCurrency = (value: number) => {
    return '[T] ' + new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
};

const chartConfig = {
  sales: {
    label: 'Sales',
    color: 'hsl(var(--chart-1))',
  },
};

export default function SalesOverTimeChart({ parsedData }: { parsedData: ParsedData }) {
  const salesData = useMemo(() => {
    const dateHeader = parsedData.headers.find(h => h.toLowerCase() === 'date');
    const fiberSaleHeader = parsedData.headers.find(h => h.toLowerCase() === 'fiber sale');
    const ontSaleHeader = parsedData.headers.find(h => h.toLowerCase() === 'ont sale');

    if (!dateHeader || !fiberSaleHeader || !ontSaleHeader) {
      return [];
    }

    const salesByDay: Record<string, number> = {};

    parsedData.data.forEach(row => {
      const dateStr = row[dateHeader];
      if (!dateStr) return;

      const totalSale = (parseFloat(row[fiberSaleHeader]) || 0) + (parseFloat(row[ontSaleHeader]) || 0);

      if (salesByDay[dateStr]) {
        salesByDay[dateStr] += totalSale;
      } else {
        salesByDay[dateStr] = totalSale;
      }
    });

    const sortedDays = Object.entries(salesByDay)
      .map(([dateStr, sales]) => {
        try {
          return {
            date: parseJalali(dateStr, 'yyyy/MM/dd', new Date()),
            sales,
          };
        } catch {
          return null;
        }
      })
      .filter((d): d is { date: Date; sales: number } => d !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
      
    let cumulativeSales = 0;
    return sortedDays.map(d => {
        cumulativeSales += d.sales;
        return {
            date: d.date.getTime(), // Use timestamp for recharts
            sales: cumulativeSales,
        }
    })

  }, [parsedData]);

  if (salesData.length === 0) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    <CardTitle>Sales Over Time</CardTitle>
                </div>
                <CardDescription>
                    Cumulative sales trend based on your data.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Could not find 'date', 'fiber sale', or 'ont sale' columns.
                </div>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
        <CardHeader>
            <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <CardTitle>Sales Over Time</CardTitle>
            </div>
            <CardDescription>
                A chart showing the cumulative sales fluctuations over time.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <AreaChart
                    accessibilityLayer
                    data={salesData}
                    margin={{
                        left: 12,
                        right: 12,
                    }}
                >
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric'})}
                        type="number"
                        domain={['dataMin', 'dataMax']}
                    />
                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => (value / 1000000).toLocaleString() + 'M'}
                    />
                    <ChartTooltip
                        cursor={false}
                        content={
                            <ChartTooltipContent
                                labelFormatter={(label) => new Date(label).toLocaleDateString('fa-IR-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' })}
                                formatter={(value) => formatCurrency(value as number)}
                                indicator="dot"
                            />
                        }
                    />
                    <defs>
                        <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-sales)" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="var(--color-sales)" stopOpacity={0.1} />
                        </linearGradient>
                    </defs>
                    <Area
                        dataKey="sales"
                        type="natural"
                        fill="url(#fillSales)"
                        fillOpacity={0.4}
                        stroke="var(--color-sales)"
                        stackId="a"
                    />
                </AreaChart>
            </ChartContainer>
        </CardContent>
    </Card>
  );
}
