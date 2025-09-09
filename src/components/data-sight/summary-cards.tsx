'use client';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, CalendarRange, Columns } from 'lucide-react';
import type { ParsedData, ColumnAnalysis } from '@/lib/data-utils';

interface SummaryCardsProps {
  parsedData: ParsedData;
  columnAnalysis: ColumnAnalysis[];
}

export default function SummaryCards({ parsedData, columnAnalysis }: SummaryCardsProps) {
  const { earliestDate, latestDate } = useMemo(() => {
    let earliest: string | null = null;
    let latest: string | null = null;
    columnAnalysis
      .filter(c => c.type === 'date')
      .forEach(c => {
        if (!earliest || c.stats.earliest < earliest) earliest = c.stats.earliest;
        if (!latest || c.stats.latest > latest) latest = c.stats.latest;
      });
    return { earliestDate: earliest, latestDate: latest };
  }, [columnAnalysis]);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Rows</CardTitle>
          <Table className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{parsedData.data.length.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">in the dataset</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Number of Columns</CardTitle>
          <Columns className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{parsedData.headers.length}</div>
          <p className="text-xs text-muted-foreground">features analyzed</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Date Range</CardTitle>
          <CalendarRange className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {earliestDate && latestDate ? (
            <>
              <div className="text-xl font-bold">{earliestDate}</div>
              <p className="text-xs text-muted-foreground">to {latestDate}</p>
            </>
          ) : (
            <div className="text-md font-bold text-muted-foreground">No date columns found</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
