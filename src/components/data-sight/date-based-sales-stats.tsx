// src/components/data-sight/date-based-sales-stats.tsx
'use client';

import { useMemo } from 'react';
import type { ParsedData } from '@/lib/data-utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Calendar, CalendarDays } from 'lucide-react';
import { parse as parseJalali, differenceInWeeks, startOfDay } from 'date-fns-jalali';
import { cn } from '@/lib/utils';

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
    className
}: {
    icon: React.ElementType,
    title: string,
    value: string,
    description: string,
    className?: string
}) => (
    <Card className="bg-card/50 shadow-sm border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={cn("text-sm font-medium", className)}>{title}</CardTitle>
            <Icon className={cn("h-4 w-4 text-muted-foreground", className)} />
        </CardHeader>
        <CardContent>
            <div className={cn("text-2xl font-bold", className)}>{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
)

export default function DateBasedSalesStats({ parsedData }: { parsedData: ParsedData }) {
    const { bestDay, worstDay, bestWeek, worstWeek } = useMemo(() => {
        const dateHeader = parsedData.headers.find(h => h.toLowerCase() === 'date');
        const fiberSaleHeader = parsedData.headers.find(h => h.toLowerCase() === 'fiber sale');
        const ontSaleHeader = parsedData.headers.find(h => h.toLowerCase() === 'ont sale');

        if (!dateHeader || !fiberSaleHeader || !ontSaleHeader) {
            return { bestDay: null, worstDay: null, bestWeek: null, worstWeek: null };
        }
        
        // --- Sales by Day ---
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

        let bestDay = { date: '', total: 0 };
        let worstDay = { date: '', total: Infinity };
        for (const [date, total] of Object.entries(salesByDay)) {
            if (total > bestDay.total) {
                bestDay = { date, total };
            }
            if (total < worstDay.total) {
                worstDay = { date, total };
            }
        }
        
        // --- Sales by Week ---
        const validDates = Object.keys(salesByDay)
            .map(dateStr => {
                try {
                    return parseJalali(dateStr, 'yyyy/MM/dd', new Date());
                } catch {
                    return null;
                }
            })
            .filter((d): d is Date => d !== null)
            .sort((a, b) => a.getTime() - b.getTime());

        if (validDates.length === 0) {
            return { 
                bestDay: bestDay.date ? bestDay : null, 
                worstDay: worstDay.date && worstDay.total !== Infinity ? worstDay : null,
                bestWeek: null, 
                worstWeek: null 
            };
        }

        const firstDate = startOfDay(validDates[0]);
        const salesByWeek: Record<number, { total: number }> = {};

        for (const [dateStr, total] of Object.entries(salesByDay)) {
            try {
                const dateObj = parseJalali(dateStr, 'yyyy/MM/dd', new Date());
                const weekNumber = differenceInWeeks(startOfDay(dateObj), firstDate, { weekStartsOn: 6 }) + 1; // Saturday
                
                if (!salesByWeek[weekNumber]) {
                    salesByWeek[weekNumber] = { total: 0 };
                }
                salesByWeek[weekNumber].total += total;

            } catch (e) {
                console.error(`Invalid date format for: ${dateStr}`, e);
            }
        }
        
        let bestWeek = { week: -1, total: -1 };
        let worstWeek = { week: -1, total: Infinity };

        for (const weekStr in salesByWeek) {
            const week = parseInt(weekStr, 10);
            const { total } = salesByWeek[week];

            if (total > bestWeek.total) {
                bestWeek = { week, total };
            }
            if (total < worstWeek.total) {
                worstWeek = { week, total };
            }
        }

        return {
            bestDay: bestDay.date ? bestDay : null,
            worstDay: worstDay.date && worstDay.total !== Infinity ? worstDay : null,
            bestWeek: bestWeek.week !== -1 ? bestWeek : null,
            worstWeek: worstWeek.week !== -1 ? worstWeek : null,
        };
    }, [parsedData]);
    
    if (!bestDay && !worstDay && !bestWeek && !worstWeek) {
        return null;
    }

    return (
        <Card className="shadow-none border border-dashed">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    <CardTitle>Date-Based Sales Analysis</CardTitle>
                </div>
                <CardDescription>
                    Analysis of sales performance based on daily and weekly trends.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {bestDay && (
                    <StatCard
                        icon={TrendingUp}
                        title="Best Selling Day"
                        value={bestDay.date}
                        description={`with ${formatCurrency(bestDay.total)} in sales`}
                        className="text-green-500"
                    />
                )}
                {worstDay && (
                    <StatCard
                        icon={TrendingDown}
                        title="Weakest Selling Day"
                        value={worstDay.date}
                        description={`with ${formatCurrency(worstDay.total)} in sales`}
                        className="text-red-500"
                    />
                )}
                {bestWeek && (
                     <StatCard
                        icon={TrendingUp}
                        title="Best Selling Week"
                        value={`${getOrdinal(bestWeek.week)} Week`}
                        description={`with ${formatCurrency(bestWeek.total)} in sales`}
                        className="text-green-500"
                    />
                )}
                {worstWeek && (
                    <StatCard
                        icon={TrendingDown}
                        title="Weakest Selling Week"
                        value={`${getOrdinal(worstWeek.week)} Week`}
                        description={`with ${formatCurrency(worstWeek.total)} in sales`}
                        className="text-red-500"
                    />
                )}
            </CardContent>
        </Card>
    );
}
