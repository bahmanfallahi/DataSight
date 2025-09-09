'use client';
import type { ColumnAnalysis } from '@/lib/data-utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Hash, CaseSensitive, CalendarDays, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const iconMap = {
  numeric: <Hash className="h-5 w-5 text-blue-500" />,
  categorical: <CaseSensitive className="h-5 w-5 text-green-500" />,
  date: <CalendarDays className="h-5 w-5 text-purple-500" />,
  unknown: <HelpCircle className="h-5 w-5 text-gray-500" />,
};

const StatItem = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex justify-between items-baseline text-sm">
    <p className="text-muted-foreground">{label}</p>
    <p className="font-mono font-medium text-foreground truncate">{typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value}</p>
  </div>
);

const ColumnCard = ({ analysis }: { analysis: ColumnAnalysis }) => (
  <Card>
    <CardHeader>
      <div className="flex items-start justify-between gap-4">
        <CardTitle className="text-base font-semibold break-all">{analysis.name}</CardTitle>
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className='cursor-pointer'>{iconMap[analysis.type]}</div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Type: {analysis.type}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      </div>
       <CardDescription>
        <Badge variant="secondary" className="capitalize">{analysis.type}</Badge>
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-2">
      <StatItem label="Filled Values" value={analysis.stats.count} />
      <StatItem label="Missing Values" value={analysis.stats.missing} />
      {analysis.type === 'numeric' && (
        <>
          <StatItem label="Mean" value={analysis.stats.mean} />
          <StatItem label="Min" value={analysis.stats.min} />
          <StatItem label="Max" value={analysis.stats.max} />
        </>
      )}
      {analysis.type === 'categorical' && (
        <StatItem label="Unique Values" value={analysis.stats.uniqueCount} />
      )}
      {analysis.type === 'date' && (
        <>
          <StatItem label="Earliest" value={analysis.stats.earliest} />
          <StatItem label="Latest" value={analysis.stats.latest} />
        </>
      )}
    </CardContent>
  </Card>
);


export default function ColumnProfiler({ columnAnalysis }: { columnAnalysis: ColumnAnalysis[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {columnAnalysis.map(analysis => (
        <ColumnCard key={analysis.name} analysis={analysis} />
      ))}
    </div>
  );
}
