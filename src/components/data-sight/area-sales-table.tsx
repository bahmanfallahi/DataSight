'use client';
import { useMemo, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ParsedData } from '@/lib/data-utils';
import { MapPin } from 'lucide-react';
import ChartDownloader from './chart-downloader';

interface AreaSalesTableProps {
  parsedData: ParsedData;
}

interface AreaSales {
  area: string;
  salesCount: number;
  fiberSale: number;
  ontSale: number;
  totalRevenue: number;
}

const formatCurrency = (value: number) => {
    return '[T] ' + new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
};

export default function AreaSalesTable({ parsedData }: AreaSalesTableProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const areaSales = useMemo<AreaSales[]>(() => {
    const areaHeader = parsedData.headers.find(h => h.toLowerCase() === 'area');
    const fiberSaleHeader = parsedData.headers.find(h => h.toLowerCase() === 'fiber sale');
    const ontSaleHeader = parsedData.headers.find(h => h.toLowerCase() === 'ont sale');

    if (!areaHeader || !fiberSaleHeader || !ontSaleHeader) {
      return [];
    }

    const salesMap: Record<string, { salesCount: number, fiberSale: number; ontSale: number }> = {};

    parsedData.data.forEach(row => {
      const area = row[areaHeader];
      if (!area) return;

      if (!salesMap[area]) {
        salesMap[area] = { salesCount: 0, fiberSale: 0, ontSale: 0 };
      }

      const fiberSale = parseFloat(String(row[fiberSaleHeader])) || 0;
      const ontSale = parseFloat(String(row[ontSaleHeader])) || 0;

      salesMap[area].salesCount += 1;
      salesMap[area].fiberSale += fiberSale;
      salesMap[area].ontSale += ontSale;
    });

    return Object.entries(salesMap)
      .map(([area, sales]) => ({
        area,
        ...sales,
        totalRevenue: sales.fiberSale + sales.ontSale,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [parsedData]);

  if (areaSales.length === 0) {
    return null; // Don't render if required columns aren't found
  }

  return (
    <Card ref={chartRef}>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
            <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <CardTitle>Area Sales Performance</CardTitle>
            </div>
            <CardDescription>
              A breakdown of sales performance by geographical area.
            </CardDescription>
        </div>
        <ChartDownloader chartRef={chartRef} />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Area</TableHead>
              <TableHead className="text-right">Number of Sales</TableHead>
              <TableHead className="text-right">Fiber Sale Revenue</TableHead>
              <TableHead className="text-right">ONT Sale Revenue</TableHead>
              <TableHead className="text-right font-semibold">Total Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {areaSales.map(sale => (
              <TableRow key={sale.area}>
                <TableCell className="font-medium">{sale.area}</TableCell>
                <TableCell className="text-right">{sale.salesCount.toLocaleString()}</TableCell>
                <TableCell className="text-right">{formatCurrency(sale.fiberSale)}</TableCell>
                <TableCell className="text-right">{formatCurrency(sale.ontSale)}</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(sale.totalRevenue)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
