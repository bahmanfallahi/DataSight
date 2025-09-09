'use client';
import type { ParsedData, ColumnAnalysis } from '@/lib/data-utils';
import AiAnalysis from '@/components/data-sight/ai-analysis';
import ColumnProfiler from '@/components/data-sight/column-profiler';
import SummaryCards from '@/components/data-sight/summary-cards';
import Visualizer from '@/components/data-sight/visualizer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { File as FileIcon } from 'lucide-react';

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileIcon className="h-5 w-5 text-muted-foreground" />
            <span>{fileName}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SummaryCards parsedData={parsedData} columnAnalysis={columnAnalysis} />
        </CardContent>
      </Card>
      
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <AiAnalysis csvData={csvData} />
        </div>
        <div className="lg:col-span-2">
           <Visualizer parsedData={parsedData} columnAnalysis={columnAnalysis} />
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Column Analysis</h2>
        <ColumnProfiler columnAnalysis={columnAnalysis} />
      </div>
    </div>
  );
}
