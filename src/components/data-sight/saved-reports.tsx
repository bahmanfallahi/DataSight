'use client';

import { useEffect, useState } from 'react';
import { getReports, type Report } from '@/lib/reports';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface SavedReportsProps {
    onSelectReport: (csvData: string, name: string) => void;
}

export default function SavedReports({ onSelectReport }: SavedReportsProps) {
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const fetchedReports = await getReports();
                setReports(fetchedReports);
            } catch (error) {
                console.error(error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not fetch saved reports.',
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchReports();
    }, [toast]);

    if (isLoading) {
        return (
            <div className="space-y-2 px-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1">
            {reports.length === 0 ? (
                <p className="p-4 text-sm text-center text-muted-foreground">No saved reports yet.</p>
            ) : (
                reports.map((report) => (
                    <Button
                        key={report.id}
                        variant="ghost"
                        className="justify-start gap-2"
                        onClick={() => onSelectReport(report.csvData, report.name)}
                    >
                        <FileText className="h-4 w-4" />
                        <div className="flex flex-col items-start">
                            <span className="font-medium">{report.name}</span>
                            <span className="text-xs text-muted-foreground">
                                {new Date(report.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </Button>
                ))
            )}
        </div>
    );
}

    