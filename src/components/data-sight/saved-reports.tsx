'use client';

import { useEffect, useState } from 'react';
import { getReports, type Report } from '@/lib/reports';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';

interface SavedReportsProps {
    onSelectReport: (csvData: string, name: string) => void;
}

export default function SavedReports({ onSelectReport }: SavedReportsProps) {
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            setReports([]);
            setIsLoading(false);
            return;
        };

        const fetchReports = async () => {
            setIsLoading(true);
            try {
                const fetchedReports = await getReports(user.uid);
                setReports(fetchedReports);
            } catch (error) {
                console.error(error);
                // The error is already handled by the permission error emitter,
                // so we don't need a toast here.
            } finally {
                setIsLoading(false);
            }
        };

        fetchReports();
    }, [user, toast]);

    if (!user) {
        return <p className="p-4 text-sm text-center text-muted-foreground">Please log in to see your reports.</p>
    }

    if (isLoading) {
        return (
            <div className="space-y-2 px-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
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
                        className="justify-start gap-2 h-auto"
                        onClick={() => onSelectReport(report.csvData, report.name)}
                    >
                        <FileText className="h-4 w-4" />
                        <div className="flex flex-col items-start">
                            <span className="font-medium text-sm">{report.name}</span>
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
