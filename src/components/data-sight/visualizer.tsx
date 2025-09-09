'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartStyle } from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis, Line, LineChart, Scatter, ScatterChart, CartesianGrid, Legend, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import type { ParsedData, ColumnAnalysis } from '@/lib/data-utils';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

const chartConfig = {
  count: { label: 'Count', color: 'hsl(var(--chart-1))' },
  value: { label: 'Value', color: 'hsl(var(--chart-2))' },
};

function formatNumber(num: number): string {
    if (Math.abs(num) < 1000) {
      // For smaller numbers, show one decimal place if not an integer
      return num.toFixed(Number.isInteger(num) ? 0 : 1);
    }
    // For larger numbers, use locale string for thousands separators
    return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

export default function Visualizer({ parsedData, columnAnalysis }: { parsedData: ParsedData; columnAnalysis: ColumnAnalysis[] }) {
  const [activeTab, setActiveTab] = useState('distribution');
  
  const [distCol, setDistCol] = useState<string | undefined>(columnAnalysis.find(c => c.type === 'categorical' || c.type === 'numeric')?.name);
  const [scatterX, setScatterX] = useState<string | undefined>(columnAnalysis.find(c => c.type === 'numeric')?.name);
  const [scatterY, setScatterY] = useState<string | undefined>(columnAnalysis.filter(c => c.type === 'numeric')[1]?.name);
  const [timeSeriesDate, setTimeSeriesDate] = useState<string | undefined>(columnAnalysis.find(c => c.type === 'date')?.name);
  const [timeSeriesValue, setTimeSeriesValue] = useState<string | undefined>(columnAnalysis.find(c => c.type === 'numeric')?.name);

  const [binCount, setBinCount] = useState([10]);

  const numericColumns = useMemo(() => columnAnalysis.filter(c => c.type === 'numeric'), [columnAnalysis]);
  const categoricalColumns = useMemo(() => columnAnalysis.filter(c => c.type === 'categorical'), [columnAnalysis]);
  const dateColumns = useMemo(() => columnAnalysis.filter(c => c.type === 'date'), [columnAnalysis]);

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

  const scatterData = useMemo(() => {
    if (!scatterX || !scatterY) return [];
    return parsedData.data.map(row => ({ x: Number(row[scatterX]), y: Number(row[scatterY])})).filter(d => !isNaN(d.x) && !isNaN(d.y));
  }, [scatterX, scatterY, parsedData]);
  
  const timeSeriesData = useMemo(() => {
    if (!timeSeriesDate || !timeSeriesValue) return [];
    return parsedData.data.map(row => ({
        date: new Date(row[timeSeriesDate]),
        value: Number(row[timeSeriesValue])
    })).filter(d => !isNaN(d.date.getTime()) && !isNaN(d.value)).sort((a,b) => a.date.getTime() - b.date.getTime());
  }, [timeSeriesDate, timeSeriesValue, parsedData]);


  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Data Visualization</CardTitle>
        <CardDescription>Explore your data through interactive charts.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="correlation">Correlation</TabsTrigger>
            <TabsTrigger value="timeseries">Time Series</TabsTrigger>
          </TabsList>
          <TabsContent value="distribution" className="mt-4">
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
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart data={distributionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} interval={distributionData.length > 15 ? 'preserveStartEnd' : 0} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                </BarChart>
                </ChartContainer>
            ) : <p className="text-center text-muted-foreground p-8">Select a column to see its distribution.</p>}
          </TabsContent>
          <TabsContent value="correlation" className="mt-4">
            <div className="flex gap-4 mb-4">
                <Select value={scatterX} onValueChange={setScatterX}>
                    <SelectTrigger className="w-1/2"><SelectValue placeholder="Select X-axis" /></SelectTrigger>
                    <SelectContent>{numericColumns.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={scatterY} onValueChange={setScatterY}>
                    <SelectTrigger className="w-1/2"><SelectValue placeholder="Select Y-axis" /></SelectTrigger>
                    <SelectContent>{numericColumns.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
            </div>
            {scatterData.length > 0 ? (
                <ChartContainer config={{}} className="h-[250px] w-full">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid />
                        <XAxis type="number" dataKey="x" name={scatterX} unit="" tick={{ fontSize: 12 }} tickFormatter={formatNumber} />
                        <YAxis type="number" dataKey="y" name={scatterY} unit="" tick={{ fontSize: 12 }} tickFormatter={formatNumber} />
                        <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter name="Sales Data" data={scatterData} fill="var(--color-value)" />
                    </ScatterChart>
                </ChartContainer>
            ) : <p className="text-center text-muted-foreground p-8">Select two numeric columns to see their correlation.</p>}
          </TabsContent>
          <TabsContent value="timeseries" className="mt-4">
            <div className="flex gap-4 mb-4">
                <Select value={timeSeriesDate} onValueChange={setTimeSeriesDate}>
                    <SelectTrigger className="w-1/2"><SelectValue placeholder="Select date column" /></SelectTrigger>
                    <SelectContent>{dateColumns.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={timeSeriesValue} onValueChange={setTimeSeriesValue}>
                    <SelectTrigger className="w-1/2"><SelectValue placeholder="Select value column" /></SelectTrigger>
                    <SelectContent>{numericColumns.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
            </div>
            {timeSeriesData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <LineChart data={timeSeriesData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString()} type="number" domain={['dataMin', 'dataMax']} tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={formatNumber}/>
                        <RechartsTooltip 
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                return (
                                    <div className="p-2 border rounded-lg bg-background/80">
                                    <p className="font-bold">{new Date(label).toLocaleDateString()}</p>
                                    <p className="text-sm" style={{ color: "var(--color-value)" }}>{`${timeSeriesValue}: ${formatNumber(payload[0].value as number)}`}</p>
                                    </div>
                                );
                                }
                                return null;
                            }}
                        />
                        <Line type="monotone" dataKey="value" stroke="var(--color-value)" strokeWidth={2} dot={false} />
                    </LineChart>
                </ChartContainer>
            ) : <p className="text-center text-muted-foreground p-8">Select date and value columns to see a time series.</p>}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
