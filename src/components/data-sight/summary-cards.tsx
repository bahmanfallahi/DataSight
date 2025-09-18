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
    const { fiberSaleTotal, ontSaleTotal, topCategoricalValues, topIntroChannel } = useMemo(() => {
        let fiberSale = 0;
        let ontSale = 0;

        const fiberSaleHeader = parsedData.headers.find(h => h.toLowerCase() === 'fiber sale');
        const ontSaleHeader = parsedData.headers.find(h => h.toLowerCase() === 'ont sale');
        const introChannelHeaderName = "how to meet";

        if (fiberSaleHeader) {
            fiberSale = parsedData.data.reduce((sum, row) => {
                const value = parseFloat(row[fiberSaleHeader]);
                return sum + (isNaN(value) ? 0 : value);
            }, 0);
        }

        if (ontSaleHeader) {
            ontSale = parsedData.data.reduce((sum, row) => {
                const value = parseFloat(row[ontSaleHeader]);
                return sum + (isNaN(value) ? 0 : value);
            }, 0);
        }

        const categoricalCols = columnAnalysis.filter(c => 
            c.type === 'categorical' && 
            c.stats.uniqueCount > 1 && 
            c.stats.uniqueCount < parsedData.data.length
        );

        const topValues = categoricalCols.map(col => {
            const topValue = Object.keys(col.stats.frequencies)[0];
            const topValueCount = col.stats.frequencies[topValue];
            return {
                columnName: col.name,
                value: topValue,
                count: topValueCount
            };
        });
        
        const introChannelCol = columnAnalysis.find(c => c.name.toLowerCase() === introChannelHeaderName);
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
            fiberSaleTotal: fiberSaleHeader ? fiberSale : null,
            ontSaleTotal: ontSaleHeader ? ontSale : null,
            topCategoricalValues: topValues.filter(v => v.columnName.toLowerCase() !== introChannelHeaderName),
            topIntroChannel
        };
    }, [parsedData, columnAnalysis]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <Card className="group transition-colors hover:bg-primary hover:text-primary-foreground">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Rows</CardTitle>
          <Table className="h-4 w-4 text-muted-foreground group-hover:text-primary-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{parsedData.data.length.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground group-hover:text-primary-foreground/80">in the dataset</p>
        </CardContent>
      </Card>
      <Card className="group transition-colors hover:bg-primary hover:text-primary-foreground">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Number of Columns</CardTitle>
          <Columns className="h-4 w-4 text-muted-foreground group-hover:text-primary-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{parsedData.headers.length}</div>
          <p className="text-xs text-muted-foreground group-hover:text-primary-foreground/80">features analyzed</p>
        </CardContent>
      </Card>
      {fiberSaleTotal !== null && (
        <Card className="group transition-colors hover:bg-primary hover:text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fiber Sale</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground group-hover:text-primary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(fiberSaleTotal)}</div>
            <p className="text-xs text-muted-foreground group-hover:text-primary-foreground/80">Sum of "Fiber sale"</p>
          </CardContent>
        </Card>
      )}
      {ontSaleTotal !== null && (
        <Card className="group transition-colors hover:bg-primary hover:text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total ONT Sale</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground group-hover:text-primary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(ontSaleTotal)}</div>
            <p className="text-xs text-muted-foreground group-hover:text-primary-foreground/80">Sum of "ont sale"</p>
          </CardContent>
        </Card>
      )}
      {topIntroChannel && (
        <Card className="group transition-colors hover:bg-primary hover:text-primary-foreground">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Intro Channel</CardTitle>
                <Contact className="h-4 w-4 text-muted-foreground group-hover:text-primary-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{topIntroChannel.value}</div>
                <p className="text-xs text-muted-foreground group-hover:text-primary-foreground/80">{topIntroChannel.count.toLocaleString()} occurrences</p>
            </CardContent>
        </Card>
      )}
      {topCategoricalValues.map(item => (
        <Card key={item.columnName} className="group transition-colors hover:bg-primary hover:text-primary-foreground">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top {item.columnName}</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground group-hover:text-primary-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{item.value}</div>
                <p className="text-xs text-muted-foreground group-hover:text-primary-foreground/80">{item.count.toLocaleString()} occurrences</p>
            </CardContent>
        </Card>
      ))}
    </div>
  );
}
