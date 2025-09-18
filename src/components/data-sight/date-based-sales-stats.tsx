// src/components/data-sight/date-based-sales-stats.tsx
'use client';

import { useMemo } from 'react';
import type { ParsedData } from '@/lib/data-utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Calendar, CalendarDays } from 'lucide-react';
import { parse as parseJalali, differenceInWeeks, startOfDay } from 'date-fns-jalali';

const formatCurrency = (value: number) => {
    // Use 'fa-IR' for Persian numerals and formatting.
    return new Intl.NumberFormat('fa-IR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + ' [T]';
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
    <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
)

export default function DateBasedSalesStats({ parsedData }: { parsedData: ParsedData }) {
    const { bestDay, bestWeek, worstWeek } = useMemo(() => {
        const dateHeader = parsedData.headers.find(h => h.toLowerCase() === 'date');
        const fiberSaleHeader = parsedData.headers.find(h => h.toLowerCase() === 'fiber sale');
        const ontSaleHeader = parsedData.headers.find(h => h.toLowerCase() === 'ont sale');

        if (!dateHeader || !fiberSaleHeader || !ontSaleHeader) {
            return { bestDay: null, bestWeek: null, worstWeek: null };
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
        for (const [date, total] of Object.entries(salesByDay)) {
            if (total > bestDay.total) {
                bestDay = { date, total };
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
            return { bestDay: bestDay.date ? bestDay : null, bestWeek: null, worstWeek: null };
        }

        const firstDate = startOfDay(validDates[0]);
        const salesByWeek: Record<number, { total: number }> = {};

        for (const [dateStr, total] of Object.entries(salesByDay)) {
            try {
                const dateObj = parseJalali(dateStr, 'yyyy/MM/dd', new Date());
                // Calculate week number relative to the first date in the dataset
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
            bestWeek: bestWeek.week !== -1 ? bestWeek : null,
            worstWeek: worstWeek.week !== -1 ? worstWeek : null,
        };
    }, [parsedData]);
    
    if (!bestDay && !bestWeek && !worstWeek) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    <CardTitle>Date-Based Sales Analysis</CardTitle>
                </div>
                <CardDescription>
                    Analysis of sales performance based on daily and weekly trends.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
                {bestDay && (
                    <StatCard
                        icon={Calendar}
                        title="Best Selling Day"
                        value={bestDay.date}
                        description={`with ${formatCurrency(bestDay.total)} in sales`}
                    />
                )}
                {bestWeek && (
                     <StatCard
                        icon={TrendingUp}
                        title="Best Selling Week"
                        value={`${getOrdinal(bestWeek.week)} Week`}
                        description={`with ${formatCurrency(bestWeek.total)} in sales`}
                        className="border-green-500/50"
                    />
                )}
                {worstWeek && (
                    <StatCard
                        icon={TrendingDown}
                        title="Weakest Selling Week"
                        value={`${getOrdinal(worstWeek.week)} Week`}
                        description={`with ${formatCurrency(worstWeek.total)} in sales`}
                        className="border-red-500/50"
                    />
                )}
            </CardContent>
        </Card>
    );
}
