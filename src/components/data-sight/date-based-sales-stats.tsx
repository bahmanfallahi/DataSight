// src/components/data-sight/date-based-sales-stats.tsx
'use client';

import { useMemo } from 'react';
import type { ParsedData } from '@/lib/data-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { parse as parseJalali, differenceInWeeks, startOfDay } from 'date-fns-jalali';
import { cn } from '@/lib/utils';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

const formatCurrency = (value: number) => {
    const formattedValue = new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
    return `[T] ${formattedValue}`;
};


const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const StatCard = ({
    icon: Icon,
    title,
    value,
    description,
    colorClass,
    chartData
}: {
    icon: React.ElementType,
    title: string,
    value: string,
    description: string,
    colorClass?: string,
    chartData: { sales: number }[];
}) => {
    const chartColor = colorClass === 'text-green-500' ? 'hsl(var(--chart-2))' : (colorClass === 'text-red-500' ? 'hsl(var(--chart-4))' : 'hsl(var(--chart-1))');

    return (
        <Card className="bg-muted/50 shadow-sm border-0 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className={cn("h-4 w-4 text-muted-foreground", colorClass)} />
            </CardHeader>
            <CardContent>
                <div className={cn("text-2xl font-bold")}>{value}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
            {chartData.length > 0 && (
                 <CardContent className="flex-1 flex flex-col justify-end pb-2">
                    <div className="h-[50px] -mx-6 -mb-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id={`color-${title.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={chartColor} stopOpacity={0.5}/>
                                        <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Area
                                    type="monotone"
                                    dataKey="sales"
                                    stroke={chartColor}
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill={`url(#color-${title.replace(/\s+/g, '-')})`}
                                    />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}

export default function DateBasedSalesStats({ parsedData }: { parsedData: ParsedData }) {
    const { 
        bestDay, 
        worstDay, 
        bestWeek, 
        worstWeek, 
        dailySalesForChart,
        weeklySalesForChart,
    } = useMemo(() => {
        const dateHeader = parsedData.headers.find(h => h.toLowerCase() === 'date');
        const fiberSaleHeader = parsedData.headers.find(h => h.toLowerCase() === 'fiber sale');
        const ontSaleHeader = parsedData.headers.find(h => h.toLowerCase() === 'ont sale');

        if (!dateHeader || !fiberSaleHeader || !ontSaleHeader) {
            return { bestDay: null, worstDay: null, bestWeek: null, worstWeek: null, dailySalesForChart: [], weeklySalesForChart: [] };
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
        
        const sortedDailySales = Object.entries(salesByDay)
            .map(([dateStr, sales]) => {
                try {
                    return { date: parseJalali(dateStr, 'yyyy/MM/dd', new Date()), sales };
                } catch { return null; }
            })
            .filter((d): d is { date: Date; sales: number } => d !== null)
            .sort((a,b) => a.date.getTime() - b.date.getTime());
        
        const dailyChanges = sortedDailySales.map(day => ({ sales: day.sales }));

        let bestDay = { date: '', total: -Infinity };
        let worstDay = { date: '', total: Infinity };

        sortedDailySales.forEach((dayData) => {
            const dayTotal = dayData.sales;
            const dateKey = Object.keys(salesByDay).find(key => salesByDay[key] === dayTotal);

            if (dayTotal > bestDay.total) {
                bestDay = { date: dateKey || '', total: dayTotal };
            }
            if (dayTotal < worstDay.total) {
                worstDay = { date: dateKey || '', total: dayTotal };
            }
        });
        
        // --- Sales by Week ---
        const validDates = sortedDailySales.map(d => d.date);
        if (validDates.length === 0) {
            return { 
                bestDay: bestDay.total !== -Infinity ? bestDay : null, 
                worstDay: worstDay.total !== Infinity ? worstDay : null,
                bestWeek: null, 
                worstWeek: null,
                dailySalesForChart: [],
                weeklySalesForChart: [],
            };
        }

        const firstDate = startOfDay(validDates[0]);
        const salesByWeek: Record<number, { total: number, weekNum: number }> = {};

        sortedDailySales.forEach(dayData => {
            try {
                const weekNumber = differenceInWeeks(startOfDay(dayData.date), firstDate, { weekStartsOn: 6 }) + 1; // Saturday
                
                if (!salesByWeek[weekNumber]) {
                    salesByWeek[weekNumber] = { total: 0, weekNum: weekNumber };
                }
                salesByWeek[weekNumber].total += dayData.sales;

            } catch (e) {
                console.error(`Invalid date format for: ${dayData.date}`, e);
            }
        });

        const sortedWeeklySales = Object.values(salesByWeek).sort((a,b) => a.weekNum - b.weekNum);

        const weeklyChanges = sortedWeeklySales.map(week => ({ sales: week.total }));
        
        let bestWeek = { week: -1, total: -1 };
        let worstWeek = { week: -1, total: Infinity };

        sortedWeeklySales.forEach((weekData) => {
            const weekTotal = weekData.total;
            
            if (weekTotal > bestWeek.total) {
                bestWeek = { week: weekData.weekNum, total: weekTotal };
            }
            if (weekTotal < worstWeek.total) {
                worstWeek = { week: weekData.weekNum, total: weekTotal };
            }
        });

        return {
            bestDay: bestDay.total !== -Infinity ? bestDay : null,
            worstDay: worstDay.total !== Infinity ? worstDay : null,
            bestWeek: bestWeek.week !== -1 ? bestWeek : null,
            worstWeek: worstWeek.week !== -1 ? worstWeek : null,
            dailySalesForChart: dailyChanges,
            weeklySalesForChart: weeklyChanges,
        };
    }, [parsedData]);
    
    if (!bestDay && !worstDay && !bestWeek && !worstWeek) {
        return null;
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {bestDay && (
                <StatCard
                    icon={TrendingUp}
                    title="Best Selling Day"
                    value={bestDay.date}
                    description={`with ${formatCurrency(bestDay.total)} in sales`}
                    colorClass="text-green-500"
                    chartData={dailySalesForChart}
                />
            )}
            {worstDay && (
                <StatCard
                    icon={TrendingDown}
                    title="Weakest Selling Day"
                    value={worstDay.date}
                    description={`with ${formatCurrency(worstDay.total)} in sales`}
                    colorClass="text-red-500"
                    chartData={dailySalesForChart}
                />
            )}
            {bestWeek && (
                <StatCard
                    icon={TrendingUp}
                    title="Best Selling Week"
                    value={`${getOrdinal(bestWeek.week)} Week`}
                    description={`with ${formatCurrency(bestWeek.total)} in sales`}
                    colorClass="text-green-500"
                    chartData={weeklySalesForChart}
                />
            )}
            {worstWeek && (
                <StatCard
                    icon={TrendingDown}
                    title="Weakest Selling Week"
                    value={`${getOrdinal(worstWeek.week)} Week`}
                    description={`with ${formatCurrency(worstWeek.total)} in sales`}
                    colorClass="text-red-500"
                    chartData={weeklySalesForChart}
                />
            )}
        </div>
    );
}
