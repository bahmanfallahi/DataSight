'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { ParsedData, ColumnAnalysis } from '@/lib/data-utils';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { AreaChart } from 'lucide-react';

const chartConfig = {
  count: { label: 'Count', color: 'hsl(var(--chart-1))' },
};

function formatNumber(num: number): string {
    if (Math.abs(num) < 1000) {
      return num.toFixed(Number.isInteger(num) ? 0 : 1);
    }
    return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function Visualizer({ parsedData, columnAnalysis }: { parsedData: ParsedData; columnAnalysis: ColumnAnalysis[] }) {
  const [distCol, setDistCol] = useState<string | undefined>(columnAnalysis.find(c => c.type === 'categorical' || c.type === 'numeric')?.name);
  const [binCount, setBinCount] = useState([10]);

  const numericColumns = useMemo(() => columnAnalysis.filter(c => c.type === 'numeric'), [columnAnalysis]);
  const categoricalColumns = useMemo(() => columnAnalysis.filter(c => c.type === 'categorical'), [columnAnalysis]);

  const distributionData = useMemo(() => {
    if (!distCol) return [];
    const colType = columnAnalysis.find(c => c.name === distCol)?.type;
    
    if (colType === 'categorical') {
      const counts: { [key: string]: number } = {};
      parsedData.data.forEach(row => {
        const val = row[distCol];
        counts[val] = (counts[val] || 0) + 1;
      });
      return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count).slice(0, 20);
    }

    if (colType === 'numeric') {
        const values = parsedData.data.map(row => Number(row[distCol])).filter(v => !isNaN(v));
        if (values.length === 0) return [];
        
        const colStats = columnAnalysis.find(c => c.name === distCol)?.stats;
        const min = colStats?.min ?? Math.min(...values);
        const max = colStats?.max ?? Math.max(...values);
        
        if (min === max) {
            return [{ name: formatNumber(min), count: values.length }];
        }

        const binSize = (max - min) / binCount[0];
        if (binSize <= 0) return [];

        const bins = Array.from({length: binCount[0]}, () => 0);
        
        values.forEach(v => {
            let binIndex = Math.floor((v - min) / binSize);
            if (binIndex >= binCount[0]) binIndex = binCount[0] - 1;
            if (binIndex < 0) binIndex = 0;
            bins[binIndex]++;
        });
        
        return bins.map((count, i) => {
            const start = min + i * binSize;
            const end = min + (i + 1) * binSize;
            return {
                name: `${formatNumber(start)}-${formatNumber(end)}`,
                count
            }
        });
    }
    return [];
  }, [distCol, parsedData, columnAnalysis, binCount]);

  return (
    <Card className="h-full shadow-none border">
      <CardHeader>
        <div className="flex items-center gap-2">
            <AreaChart className="h-5 w-5" />
            <CardTitle className="font-semibold">Data Distribution</CardTitle>
        </div>
        <CardDescription>Analyze the distribution of values in your columns.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <Select value={distCol} onValueChange={setDistCol}>
            <SelectTrigger><SelectValue placeholder="Select column" /></SelectTrigger>
            <SelectContent>
                {numericColumns.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                {categoricalColumns.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
            </SelectContent>
            </Select>
            {columnAnalysis.find(c => c.name === distCol)?.type === 'numeric' && (
            <div className='flex items-center gap-4 w-full sm:w-1/2'>
                <Label className='whitespace-nowrap'>Bins: {binCount[0]}</Label>
                <Slider value={binCount} onValueChange={setBinCount} min={2} max={50} step={1} />
            </div>
            )}
        </div>
        {distributionData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={distributionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} interval={distributionData.length > 15 ? 'preserveStartEnd' : 0} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
            </BarChart>
            </ChartContainer>
        ) : <p className="text-center text-muted-foreground p-8">Select a column to see its distribution.</p>}
      </CardContent>
    </Card>
  );
}
