'use client';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, Columns, DollarSign } from 'lucide-react';
import type { ParsedData, ColumnAnalysis } from '@/lib/data-utils';

interface SummaryCardsProps {
  parsedData: ParsedData;
  columnAnalysis: ColumnAnalysis[];
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

export default function SummaryCards({ parsedData, columnAnalysis }: SummaryCardsProps) {
    const { modemCosts, fiberCosts } = useMemo(() => {
        let modemTotal = 0;
        let fiberTotal = 0;

        const modemCostHeader = parsedData.headers.find(h => h.toLowerCase() === 'column6');
        const fiberCostHeader = parsedData.headers.find(h => h.toLowerCase() === 'column7');

        if (modemCostHeader) {
            modemTotal = parsedData.data.reduce((sum, row) => {
                const value = parseFloat(row[modemCostHeader]);
                return sum + (isNaN(value) ? 0 : value);
            }, 0);
        }

        if (fiberCostHeader) {
            fiberTotal = parsedData.data.reduce((sum, row) => {
                const value = parseFloat(row[fiberCostHeader]);
                return sum + (isNaN(value) ? 0 : value);
            }, 0);
        }

        return { 
            modemCosts: modemCostHeader ? modemTotal : null,
            fiberCosts: fiberCostHeader ? fiberTotal : null
        };
    }, [parsedData]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
      {modemCosts !== null && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fiber Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(modemCosts)}</div>
            <p className="text-xs text-muted-foreground">Sum of Column6</p>
          </CardContent>
        </Card>
      )}
      {fiberCosts !== null && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total ONT sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(fiberCosts)}</div>
            <p className="text-xs text-muted-foreground">Sum of Column7</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
