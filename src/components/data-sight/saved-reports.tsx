'use client';

import { useState } from 'react';
import { deleteReport, type Report } from '@/lib/reports';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { FileText, Trash2, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth, type UserProfile } from '@/hooks/use-auth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface SavedReportsProps {
    reports: Report[];
    isLoading: boolean;
    onSelectReport: (csvData: string, name: string) => void;
    onDeleteReport: () => Promise<void>;
    userProfile: UserProfile | null;
}

export default function SavedReports({ reports, isLoading, onSelectReport, onDeleteReport, userProfile }: SavedReportsProps) {
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
    const { toast } = useToast();
    const { user } = useAuth();

    const isAdmin = userProfile?.role === 'admin';
    
    const handleDeleteClick = (report: Report) => {
        setReportToDelete(report);
    };

    const handleConfirmDelete = async () => {
        if (!reportToDelete) return;

        setIsDeleting(reportToDelete.id);
        try {
            await deleteReport(reportToDelete.id);
            toast({
                title: "Report Deleted",
                description: `"${reportToDelete.name}" has been deleted.`,
            });
            await onDeleteReport(); // Refresh the list in the parent component
        } catch (error) {
             // Error is handled by the global error handler
        } finally {
            setIsDeleting(null);
            setReportToDelete(null);
        }
    };

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
        <>
            <div className="flex flex-col gap-1">
                {reports.length === 0 ? (
                    <p className="p-4 text-sm text-center text-muted-foreground">No saved reports yet.</p>
                ) : (
                    reports.map((report) => (
                        <div key={report.id} className="group flex items-center justify-between gap-1 w-full rounded-md hover:bg-accent">
                             <Button
                                variant="ghost"
                                className="flex-1 justify-start gap-2 h-auto text-left"
                                onClick={() => onSelectReport(report.csvData, report.name)}
                            >
                                <FileText className="h-4 w-4" />
                                <div className="flex flex-col items-start overflow-hidden">
                                    <span className="font-medium text-sm truncate">{report.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(report.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </Button>
                            {isAdmin && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDeleteClick(report)}
                                    disabled={!!isDeleting}
                                >
                                    {isDeleting === report.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}
                                </Button>
                            )}
                        </div>
                       
                    ))
                )}
            </div>

            <AlertDialog open={!!reportToDelete} onOpenChange={(open) => !open && setReportToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the report "{reportToDelete?.name}". This action cannot be undone.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirmDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        Delete
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
