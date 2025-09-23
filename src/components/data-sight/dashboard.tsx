'use client';
import type { ParsedData, ColumnAnalysis } from '@/lib/data-utils';
import AiAnalysis from '@/components/data-sight/ai-analysis';
import ColumnProfiler from '@/components/data-sight/column-profiler';
import SummaryCards from '@/components/data-sight/summary-cards';
import Visualizer from '@/components/data-sight/visualizer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { File as FileIcon } from 'lucide-react';
import AgentSalesTable from './agent-sales-table';
import DateBasedSalesStats from './date-based-sales-stats';
import SalesOverTimeChart from './sales-over-time-chart';

interface DashboardProps {
  csvData: string;
  parsedData: ParsedData;
  columnAnalysis: ColumnAnalysis[];
  fileName: string;
}

export default function Dashboard({
  csvData,
  parsedData,
  columnAnalysis,
  fileName,
}: DashboardProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileIcon className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl font-medium text-muted-foreground">{fileName}</h1>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      <SummaryCards parsedData={parsedData} columnAnalysis={columnAnalysis} />

      <AgentSalesTable parsedData={parsedData} />
      
      <DateBasedSalesStats parsedData={parsedData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SalesOverTimeChart parsedData={parsedData} />
        <Visualizer parsedData={parsedData} columnAnalysis={columnAnalysis} />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-3">
          <AiAnalysis csvData={csvData} />
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Column Profiler</h2>
        <ColumnProfiler columnAnalysis={columnAnalysis} />
      </div>
    </div>
  );
}
