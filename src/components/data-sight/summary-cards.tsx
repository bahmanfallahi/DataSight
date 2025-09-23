'use client';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, Columns, DollarSign, Star, Contact, Tag, Percent } from 'lucide-react';
import type { ParsedData, ColumnAnalysis } from '@/lib/data-utils';

interface SummaryCardsProps {
  parsedData: ParsedData;
  columnAnalysis: ColumnAnalysis[];
}

const formatCurrency = (value: number) => {
    return '[T] ' + new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
};

export default function SummaryCards({ parsedData, columnAnalysis }: SummaryCardsProps) {
    const { 
        fiberSaleTotal, 
        ontSaleTotal, 
        topCategoricalValues, 
        topIntroChannel,
        topOntSale,
        topFiberSale,
    } = useMemo(() => {
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
        
        const specificColumns = [introChannelHeaderName, 'ont sale', 'fiber sale'];

        const categoricalCols = columnAnalysis.filter(c => 
            c.type === 'categorical' && 
            c.stats.uniqueCount > 1 && 
            c.stats.uniqueCount < parsedData.data.length &&
            !specificColumns.includes(c.name.toLowerCase())
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
        
        let topIntroChannel = null;
        const introChannelCol = columnAnalysis.find(c => c.name.toLowerCase() === introChannelHeaderName);
        if (introChannelCol?.type === 'categorical') {
            const topValue = Object.keys(introChannelCol.stats.frequencies)[0];
            const topValueCount = introChannelCol.stats.frequencies[topValue];
            topIntroChannel = { value: topValue, count: topValueCount };
        }

        let topOntSale = null;
        const ontSaleCol = columnAnalysis.find(c => c.name.toLowerCase() === 'ont sale');
        if (ontSaleCol) {
             const frequencies: Record<string, number> = {};
             parsedData.data.forEach(row => {
                const val = row[ontSaleCol.name];
                if (val === null || val === undefined || val === '') return;
                const key = String(val);
                frequencies[key] = (frequencies[key] || 0) + 1;
             });

             if(Object.keys(frequencies).length > 0){
                const topValue = Object.entries(frequencies).sort((a,b) => b[1] - a[1])[0];
                topOntSale = { value: topValue[0], count: topValue[1] };
             }
        }
        
        let topFiberSale = null;
        const fiberSaleCol = columnAnalysis.find(c => c.name.toLowerCase() === 'fiber sale');
        if (fiberSaleCol) {
            const frequencies: Record<string, {count: number, label: string}> = {};
            parsedData.data.forEach(row => {
                const val = row[fiberSaleCol.name];
                if (val === null || val === undefined || val === '') return;
                
                const numVal = Number(val);
                const key = String(val);
                let label = key;

                if (!isNaN(numVal) && numVal < 1650000) {
                    label = 'Fiber Sale with Discount';
                }

                if (!frequencies[label]) {
                    frequencies[label] = { count: 0, label: label};
                }
                frequencies[label].count++;
            });

            if(Object.keys(frequencies).length > 0){
                 const topValue = Object.values(frequencies).sort((a,b) => b.count - a.count)[0];
                 topFiberSale = { value: topValue.label, count: topValue.count };
            }
        }


        return { 
            fiberSaleTotal: fiberSaleHeader ? fiberSale : null,
            ontSaleTotal: ontSaleHeader ? ontSale : null,
            topCategoricalValues: topValues,
            topIntroChannel,
            topOntSale,
            topFiberSale,
        };
    }, [parsedData, columnAnalysis]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
       {topFiberSale && (
        <Card className="group transition-colors hover:bg-primary hover:text-primary-foreground">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Fiber Sale Type</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground group-hover:text-primary-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-lg font-bold">{topFiberSale.value}</div>
                <p className="text-xs text-muted-foreground group-hover:text-primary-foreground/80">{topFiberSale.count.toLocaleString()} occurrences</p>
            </CardContent>
        </Card>
      )}
      {topOntSale && (
        <Card className="group transition-colors hover:bg-primary hover:text-primary-foreground">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top ONT Sale Type</CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground group-hover:text-primary-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{topOntSale.value}</div>
                <p className="text-xs text-muted-foreground group-hover:text-primary-foreground/80">{topOntSale.count.toLocaleString()} occurrences</p>
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
