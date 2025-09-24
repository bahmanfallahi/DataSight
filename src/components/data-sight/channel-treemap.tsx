'use client';

import { useMemo, useRef } from 'react';
import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ParsedData } from '@/lib/data-utils';
import { Waypoints } from 'lucide-react';
import ChartDownloader from './chart-downloader';

const formatCurrency = (value: number) => {
    return '[T] ' + new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
};

const COLORS = ['#0d47a1', '#1565c0', '#1976d2', '#1e88e5', '#2196f3', '#42a5f5', '#64b5f6', '#90caf9', '#bbdefb', '#e3f2fd'].reverse();

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border shadow-lg rounded-lg p-3 text-sm">
        <p className="font-bold text-foreground">{data.name}</p>
        <p className="text-muted-foreground">Total Revenue: {formatCurrency(data.size)}</p>
      </div>
    );
  }
  return null;
};

const CustomizedContent = (props: any) => {
    const { root, depth, x, y, width, height, index, payload, rank, name } = props;
    const padding = 4;
    const contentWidth = width - padding * 2;
    const contentHeight = height - padding * 2;

    if (width < 30 || height < 30) {
        return null;
    }

    return (
        <g>
            <rect
                x={x + padding / 2}
                y={y + padding / 2}
                width={width - padding}
                height={height - padding}
                rx={4}
                ry={4}
                style={{
                    fill: COLORS[index % COLORS.length],
                    stroke: 'none',
                }}
            />
            <foreignObject x={x + padding} y={y + padding} width={contentWidth} height={contentHeight}>
                 <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <p style={{
                         color: '#fff',
                         textAlign: 'center',
                         fontSize: '12px',
                         wordWrap: 'break-word'
                     }}>
                        {name}
                    </p>
                 </div>
            </foreignObject>
        </g>
    );
};

export default function ChannelTreemap({ parsedData }: { parsedData: ParsedData }) {
    const chartRef = useRef<HTMLDivElement>(null);
    const treemapData = useMemo(() => {
        const channelHeader = parsedData.headers.find(h => h.toLowerCase() === 'how to meet');
        const fiberSaleHeader = parsedData.headers.find(h => h.toLowerCase() === 'fiber sale');
        const ontSaleHeader = parsedData.headers.find(h => h.toLowerCase() === 'ont sale');

        if (!channelHeader || !fiberSaleHeader || !ontSaleHeader) {
            return [];
        }

        const channelSales: Record<string, number> = {};

        parsedData.data.forEach(row => {
            const channel = row[channelHeader];
            if (!channel) return;

            const fiberSale = parseFloat(row[fiberSaleHeader]) || 0;
            const ontSale = parseFloat(row[ontSaleHeader]) || 0;
            const totalSale = fiberSale + ontSale;

            if (channelSales[channel]) {
                channelSales[channel] += totalSale;
            } else {
                channelSales[channel] = totalSale;
            }
        });

        return Object.entries(channelSales).map(([name, size]) => ({
            name,
            size,
        })).sort((a,b) => b.size - a.size);
    }, [parsedData]);
    
    if (treemapData.length === 0) {
        return (
             <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Waypoints className="h-5 w-5" />
                        <CardTitle>Channel Effectiveness</CardTitle>
                    </div>
                    <CardDescription>
                        Visualizing sales contribution by acquisition channel.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        Could not find 'how to meet', 'fiber sale', or 'ont sale' columns.
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card ref={chartRef}>
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Waypoints className="h-5 w-5" />
                        <CardTitle>Channel Effectiveness</CardTitle>
                    </div>
                    <CardDescription>
                        A treemap visualizing sales contribution by acquisition channel.
                    </CardDescription>
                </div>
                <ChartDownloader chartRef={chartRef} />
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                    <Treemap
                        data={treemapData}
                        dataKey="size"
                        ratio={4 / 3}
                        stroke="#fff"
                        fill="#8884d8"
                        content={<CustomizedContent />}
                    >
                      <Tooltip content={<CustomTooltip />} />
                    </Treemap>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
