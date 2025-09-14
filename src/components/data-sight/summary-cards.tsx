'use client';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, Columns, DollarSign, Star, Contact } from 'lucide-react';
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
    const { modemCosts, fiberCosts, topCategoricalValues, topIntroChannel } = useMemo(() => {
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

        const categoricalCols = columnAnalysis.filter(c => c.type === 'categorical' && c.stats.uniqueCount > 1 && c.stats.uniqueCount < parsedData.data.length);
        const topValues = categoricalCols.map(col => {
            const topValue = Object.keys(col.stats.frequencies)[0];
            const topValueCount = col.stats.frequencies[topValue];
            return {
                columnName: col.name,
                value: topValue,
                count: topValueCount
            };
        });
        
        // Specifically find the top introduction channel, assuming it's in a column named "Column10"
        const introChannelCol = columnAnalysis.find(c => c.name.toLowerCase() === 'column10');
        let topIntroChannel = null;
        if (introChannelCol && introChannelCol.type === 'categorical') {
            const topValue = Object.keys(introChannelCol.stats.frequencies)[0];
            const topValueCount = introChannelCol.stats.frequencies[topValue];
            topIntroChannel = {
                value: topValue,
                count: topValueCount
            };
        }


        return { 
            modemCosts: modemCostHeader ? modemTotal : null,
            fiberCosts: fiberCostHeader ? fiberTotal : null,
            topCategoricalValues: topValues.filter(v => v.columnName.toLowerCase() !== 'column10'), // Exclude intro channel from generic cards
            topIntroChannel
        };
    }, [parsedData, columnAnalysis]);

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
        </dCardHeader>
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
      {topIntroChannel && (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Intro Channel</CardTitle>
                <Contact className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{topIntroChannel.value}</div>
                <p className="text-xs text-muted-foreground">{topIntroChannel.count.toLocaleString()} occurrences</p>
            </CardContent>
        </Card>
      )}
      {topCategoricalValues.map(item => (
        <Card key={item.columnName}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top {item.columnName}</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{item.value}</div>
                <p className="text-xs text-muted-foreground">{item.count.toLocaleString()} occurrences</p>
            </CardContent>
        </Card>
      ))}
    </div>
  );
}
