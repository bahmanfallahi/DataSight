'use client';
import type { ParsedData, ColumnAnalysis } from '@/lib/data-utils';
import ColumnProfiler from '@/components/data-sight/column-profiler';
import SummaryCards from '@/components/data-sight/summary-cards';
import Visualizer from '@/components/data-sight/visualizer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { File as FileIcon, CalendarClock } from 'lucide-react';
import AgentSalesTable from './agent-sales-table';
import DateBasedSalesStats from './date-based-sales-stats';
import SalesOverTimeChart from './sales-over-time-chart';
import ExpertSalesPieChart from './expert-sales-pie-chart';
import OntSalesPieChart from './ont-sales-pie-chart';
import AreaSalesPieChart from './area-sales-pie-chart';
import AreaSalesTable from './area-sales-table';
import ChannelTreemap from './channel-treemap';
import { useRef, forwardRef } from 'react';
import ChartDownloader from './chart-downloader';

interface DashboardProps {
  parsedData: ParsedData;
  columnAnalysis: ColumnAnalysis[];
  fileName: string;
}

const Dashboard = forwardRef<HTMLDivElement, DashboardProps>(({
  parsedData,
  columnAnalysis,
  fileName,
}, ref) => {
  const dateStatsRef = useRef<HTMLDivElement>(null);
  return (
    <div className="space-y-6" ref={ref}>
      <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileIcon className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl font-medium text-muted-foreground">{fileName}</h1>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      <SummaryCards parsedData={parsedData} columnAnalysis={columnAnalysis} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card ref={dateStatsRef}>
          <CardHeader className="flex flex-row items-start justify-between">
              <div>
                  <div className="flex items-center gap-2">
                      <CalendarClock className="h-5 w-5" />
                      <CardTitle>Date-Based Sales Analysis</CardTitle>
                  </div>
                  <CardDescription>Key sales metrics based on daily and weekly performance.</CardDescription>
              </div>
              <ChartDownloader chartRef={dateStatsRef} />
          </CardHeader>
          <CardContent>
              <DateBasedSalesStats parsedData={parsedData} />
          </CardContent>
        </Card>
        <Visualizer parsedData={parsedData} columnAnalysis={columnAnalysis} />
      </div>

      <SalesOverTimeChart parsedData={parsedData} />
      
      <ChannelTreemap parsedData={parsedData} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ExpertSalesPieChart parsedData={parsedData} />
        <OntSalesPieChart parsedData={parsedData} />
        <AreaSalesPieChart parsedData={parsedData} />
      </div>
      
      <AgentSalesTable parsedData={parsedData} />
      
      <AreaSalesTable parsedData={parsedData} />
      
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Column Profiler</h2>
        <ColumnProfiler columnAnalysis={columnAnalysis} />
      </div>
    </div>
  );
});

Dashboard.displayName = "Dashboard";

export default Dashboard;
