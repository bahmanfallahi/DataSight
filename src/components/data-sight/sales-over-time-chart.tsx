'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ReferenceDot, ReferenceArea, Legend } from 'recharts';
import type { ParsedData } from '@/lib/data-utils';
import { parse as parseJalali, startOfWeek, endOfWeek, format as formatJalali } from 'date-fns-jalali';
import { TrendingUp, Star, Ban } from 'lucide-react';

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
  const { 
    salesData, 
    bestDay, 
    worstDay,
    bestWeekRange,
    worstWeekRange
  } = useMemo(() => {
    const dateHeader = parsedData.headers.find(h => h.toLowerCase() === 'date');
    const fiberSaleHeader = parsedData.headers.find(h => h.toLowerCase() === 'fiber sale');
    const ontSaleHeader = parsedData.headers.find(h => h.toLowerCase() === 'ont sale');

    if (!dateHeader || !fiberSaleHeader || !ontSaleHeader) {
      return { salesData: [], bestDay: null, worstDay: null, bestWeekRange: null, worstWeekRange: null };
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

    if (sortedDays.length === 0) {
      return { salesData: [], bestDay: null, worstDay: null, bestWeekRange: null, worstWeekRange: null };
    }

    let bestDay = { date: sortedDays[0].date, sales: -1 };
    let worstDay = { date: sortedDays[0].date, sales: Infinity };
    
    sortedDays.forEach(day => {
        if(day.sales > bestDay.sales) {
            bestDay = day;
        }
        if(day.sales < worstDay.sales) {
            worstDay = day;
        }
    });


    const salesByWeek: Record<string, { total: number, start: Date, end: Date}> = {};
    sortedDays.forEach(({ date, sales }) => {
        const weekStart = startOfWeek(date, { weekStartsOn: 6 }); // Saturday
        const weekEnd = endOfWeek(date, { weekStartsOn: 6 });
        const weekKey = formatJalali(weekStart, 'yyyy-MM-dd');
        
        if (!salesByWeek[weekKey]) {
            salesByWeek[weekKey] = { total: 0, start: weekStart, end: weekEnd };
        }
        salesByWeek[weekKey].total += sales;
    });

    let bestWeek = { total: -1, start: new Date(), end: new Date() };
    let worstWeek = { total: Infinity, start: new Date(), end: new Date() };

    Object.values(salesByWeek).forEach(week => {
        if(week.total > bestWeek.total) {
            bestWeek = week;
        }
        if(week.total < worstWeek.total) {
            worstWeek = week;
        }
    });

    const finalSalesData = sortedDays.map(d => ({
        date: d.date.getTime(),
        sales: d.sales,
    }));
    
    return {
        salesData: finalSalesData,
        bestDay: { ...bestDay, date: bestDay.date.getTime() },
        worstDay: { ...worstDay, date: worstDay.date.getTime() },
        bestWeekRange: bestWeek.total > -1 ? { x1: bestWeek.start.getTime(), x2: bestWeek.end.getTime() } : null,
        worstWeekRange: worstWeek.total < Infinity ? { x1: worstWeek.start.getTime(), x2: worstWeek.end.getTime() } : null,
    }

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
                    Daily sales trend with best/worst periods highlighted.
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
                A chart showing daily sales, with best and worst sales periods highlighted.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
                <AreaChart
                    accessibilityLayer
                    data={salesData}
                    margin={{
                        left: 12,
                        right: 12,
                        top: 20,
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
                     <Legend content={({ payload }) => {
                         return (
                            <div className="flex justify-center items-center gap-6 mt-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500/30 border border-green-500"/>
                                    <span>Best Week</span>
                                </div>
                                 <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/30 border border-red-500"/>
                                    <span>Worst Week</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                                    <span>Best Day</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Ban className="w-4 h-4 text-red-600" />
                                    <span>Worst Day</span>
                                </div>
                            </div>
                         )
                     }}/>
                    <defs>
                        <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                            <stop
                                offset="5%"
                                stopColor="var(--color-sales)"
                                stopOpacity={0.8}
                            />
                            <stop
                                offset="95%"
                                stopColor="var(--color-sales)"
                                stopOpacity={0.1}
                            />
                        </linearGradient>
                    </defs>
                    <Area
                        dataKey="sales"
                        type="natural"
                        fill="url(#fillSales)"
                        stroke="var(--color-sales)"
                        stackId="a"
                    />

                    {bestWeekRange && <ReferenceArea x1={bestWeekRange.x1} x2={bestWeekRange.x2} stroke="transparent" fill="green" fillOpacity={0.1} />}
                    {worstWeekRange && <ReferenceArea x1={worstWeekRange.x1} x2={worstWeekRange.x2} stroke="transparent" fill="red" fillOpacity={0.1} />}

                    {bestDay && <ReferenceDot x={bestDay.date} y={bestDay.sales} r={6} fill="hsl(var(--background))" stroke="rgb(250, 204, 21)" strokeWidth={2} />}
                    {worstDay && <ReferenceDot x={worstDay.date} y={worstDay.sales} r={6} fill="hsl(var(--background))" stroke="rgb(220, 38, 38)" strokeWidth={2} />}
                </AreaChart>
            </ChartContainer>
        </CardContent>
    </Card>
  );
}
