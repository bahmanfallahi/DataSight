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

const COLORS = ["#F89D2A", "#3D5186", "#586786", "#8D9DAE", "#AAB5C2", "#C5CED6"];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const totalRevenue = payload[0].payload.root.children.reduce((acc: number, curr: any) => acc + curr.size, 0);
    const percentage = ((data.size / totalRevenue) * 100).toFixed(1);
    return (
      <div className="bg-background border border-border shadow-lg rounded-lg p-3 text-sm">
        <p className="font-bold text-foreground">{data.name}</p>
        <p className="text-muted-foreground">Total Revenue: {formatCurrency(data.size)} ({percentage}%)</p>
      </div>
    );
  }
  return null;
};

const CustomizedContent = (props: any) => {
    const { x, y, width, height, index, name, size, root } = props;
    
    const canDisplayText = width > 50 && height > 40;

    const totalRevenue = useMemo(() => {
        if (!root || !root.children) return 0;
        return root.children.reduce((acc: number, curr: any) => acc + curr.size, 0);
    }, [root]);
    
    const percentage = totalRevenue > 0 ? ((size / totalRevenue) * 100).toFixed(1) : 0;

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                rx={4} 
                ry={4}
                style={{
                    fill: COLORS[index % COLORS.length],
                    stroke: 'none',
                }}
            />
            {canDisplayText && (
                 <foreignObject x={x + 4} y={y + 4} width={width - 8} height={height - 8} style={{ pointerEvents: 'none' }}>
                     <div style={{ 
                        width: '100%', 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center', 
                        justifyContent: 'center',
                        padding: '2px',
                        color: '#fff',
                        textAlign: 'center',
                        fontSize: '12px',
                        lineHeight: 1.3
                      }}>
                         <div style={{ fontWeight: 500, wordBreak: 'break-word' }}>{name}</div>
                         <div style={{ fontSize: '11px', opacity: 0.8 }}>{percentage}%</div>
                     </div>
                </foreignObject>
            )}
        </g>
    );
};

export default function ChannelTreemap({ parsedData }: { parsedData: ParsedData }) {
    const chartRef = useRef<HTMLDivElement>(null);
    const { treemapData, totalRevenue } = useMemo(() => {
        const channelHeader = parsedData.headers.find(h => h.toLowerCase() === 'how to meet');
        const fiberSaleHeader = parsedData.headers.find(h => h.toLowerCase() === 'fiber sale');
        const ontSaleHeader = parsedData.headers.find(h => h.toLowerCase() === 'ont sale');

        if (!channelHeader || !fiberSaleHeader || !ontSaleHeader) {
            return { treemapData: [], totalRevenue: 0 };
        }

        const channelSales: Record<string, number> = {};
        let totalRevenue = 0;

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
            totalRevenue += totalSale;
        });
        
        const data = Object.entries(channelSales).map(([name, size]) => ({
            name,
            size,
        })).sort((a,b) => b.size - a.size);

        return { treemapData: data, totalRevenue };
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
                        stroke="#ffffff"
                        strokeWidth={2}
                        content={<CustomizedContent />}
                    >
                      <Tooltip content={<CustomTooltip />} />
                    </Treemap>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
