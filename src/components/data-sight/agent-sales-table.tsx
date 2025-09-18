'use client';
import { useMemo } from 'react';
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
import { User, DollarSign } from 'lucide-react';

interface AgentSalesTableProps {
  parsedData: ParsedData;
}

interface AgentSales {
  agent: string;
  fiberSale: number;
  ontSale: number;
  totalRevenue: number;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
};

export default function AgentSalesTable({ parsedData }: AgentSalesTableProps) {
  const agentSales = useMemo<AgentSales[]>(() => {
    const agentHeader = parsedData.headers.find(h => h.toLowerCase() === 'agent');
    const fiberSaleHeader = parsedData.headers.find(h => h.toLowerCase() === 'fiber sale');
    const ontSaleHeader = parsedData.headers.find(h => h.toLowerCase() === 'ont sale');

    if (!agentHeader || !fiberSaleHeader || !ontSaleHeader) {
      return [];
    }

    const salesMap: Record<string, { fiberSale: number; ontSale: number }> = {};

    parsedData.data.forEach(row => {
      const agent = row[agentHeader];
      if (!agent) return;

      if (!salesMap[agent]) {
        salesMap[agent] = { fiberSale: 0, ontSale: 0 };
      }

      const fiberSale = parseFloat(row[fiberSaleHeader]) || 0;
      const ontSale = parseFloat(row[ontSaleHeader]) || 0;

      salesMap[agent].fiberSale += fiberSale;
      salesMap[agent].ontSale += ontSale;
    });

    return Object.entries(salesMap)
      .map(([agent, sales]) => ({
        agent,
        ...sales,
        totalRevenue: sales.fiberSale + sales.ontSale,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [parsedData]);

  if (agentSales.length === 0) {
    return null; // Don't render the component if the required columns aren't found
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle>Agent Sales Performance</CardTitle>
        </div>
        <CardDescription>
          A breakdown of sales performance by each agent.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead className="text-right">Fiber Sale</TableHead>
              <TableHead className="text-right">ONT Sale</TableHead>
              <TableHead className="text-right font-semibold">Total Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agentSales.map(sale => (
              <TableRow key={sale.agent}>
                <TableCell className="font-medium">{sale.agent}</TableCell>
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
