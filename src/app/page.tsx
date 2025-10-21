'use client';

import { useState, ChangeEvent, useCallback } from 'react';
import type { ParsedData, ColumnAnalysis } from '@/lib/data-utils';
import { parseDataFile, analyzeColumns } from '@/lib/data-utils';
import Dashboard from '@/components/data-sight/dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, Loader2, X, Save, FileClock } from 'lucide-react';
import packageJson from '../../package.json';
import { ThemeToggle } from '@/components/theme-toggle';
import DataSightLogo from '@/components/data-sight/logo';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenuItem, SidebarMenu, SidebarMenuButton, SidebarInset } from '@/components/ui/sidebar';
import SavedReports from '@/components/data-sight/saved-reports';
import { saveReport } from '@/lib/reports';

// Helper to convert parsed data back to a CSV string
const convertToCsvString = (parsedData: ParsedData): string => {
  const headers = parsedData.headers.join(',');
  const rows = parsedData.data.map(row =>
    parsedData.headers.map(header => {
      const value = row[header];
      // Handle values that might contain commas by wrapping them in quotes
      const formattedValue = typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      return formattedValue;
    }).join(',')
  ).join('\n');
  return `${headers}\n${rows}`;
};


export default function Home() {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [columnAnalysis, setColumnAnalysis] = useState<ColumnAnalysis[] | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please upload a CSV or Excel file.',
      });
      return;
    }

    setIsLoading(true);
    setFileName(file.name);

    try {
      const parsed = await parseDataFile(file);
      
      if (parsed.data.length === 0) {
        throw new Error('File is empty or could not be parsed.');
      }
      
      const analysis = analyzeColumns(parsed.data, parsed.headers);

      setParsedData(parsed);
      setColumnAnalysis(analysis);
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        variant: 'destructive',
        title: 'Error Processing File',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
      handleReset();
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setParsedData(null);
    setColumnAnalysis(null);
    setFileName('');
    setIsLoading(false);
  };
  
  const handleSaveData = async () => {
    if (!parsedData || !fileName) {
        toast({
            variant: 'destructive',
            title: 'No Data to Save',
            description: 'Please upload a file first.',
        });
        return;
    }
    setIsSaving(true);
    try {
        const csvToSave = convertToCsvString(parsedData);
        await saveReport(fileName, csvToSave);
        toast({
            title: 'Report Saved',
            description: `${fileName} has been saved successfully.`,
        });
    } catch (error) {
        console.error('Error saving report:', error);
        toast({
            variant: 'destructive',
            title: 'Error Saving Report',
            description: 'Could not save the report. Please try again.',
        });
    } finally {
        setIsSaving(false);
    }
  };
  
  const loadSavedReport = useCallback(async (reportCsv: string, reportName: string) => {
    setIsLoading(true);
    setFileName(reportName);
    try {
      const file = new File([reportCsv], reportName, { type: 'text/csv' });
      const parsed = await parseDataFile(file);
      
      if (parsed.data.length === 0) {
        throw new Error('Saved report is empty or corrupted.');
      }
      
      const analysis = analyzeColumns(parsed.data, parsed.headers);
      
      setParsedData(parsed);
      setColumnAnalysis(analysis);

    } catch (error) {
       console.error('Error loading saved report:', error);
       toast({
         variant: 'destructive',
         title: 'Error Loading Report',
         description: 'The saved report data appears to be corrupted.',
       });
       handleReset();
    } finally {
       setIsLoading(false);
    }
  }, [toast]);


  const FileUploader = () => (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative border-2 border-dashed border-border rounded-xl p-8 text-center transition-colors hover:border-primary/80 bg-secondary/30 hover:bg-secondary/50">
        <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">Drag & drop your file</h3>
        <p className="mt-1 text-sm text-muted-foreground">or click to browse for a CSV or Excel file</p>
        <Input
          id="file-upload"
          type="file"
          accept=".csv, .xlsx, .xls"
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading}
        />
      </div>
    </div>
  );

  return (
    <SidebarProvider>
      <Sidebar>
          <SidebarHeader>
              <div className="flex items-center gap-2">
                  <FileClock className="h-6 w-6" />
                  <h2 className="text-lg font-semibold">Saved Reports</h2>
              </div>
          </SidebarHeader>
          <SidebarContent>
             <SavedReports onSelectReport={loadSavedReport} />
          </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="min-h-screen flex flex-col">
          <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <DataSightLogo className="h-7 w-7" />
                <h1 className="text-2xl font-bold tracking-tight">DataSight</h1>
              </div>
              <div className="flex items-center gap-2">
                {parsedData && (
                  <>
                    <Button variant="outline" size="sm" onClick={handleSaveData} disabled={isSaving}>
                      {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Data
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleReset}>
                      <X className="mr-2 h-4 w-4" />
                      Clear Data
                    </Button>
                  </>
                )}
                <ThemeToggle />
              </div>
            </div>
          </header>

          <main className="flex-1">
            <div className="container mx-auto px-4 md:px-6 py-8">
              {!parsedData && !isLoading && (
                <div className="flex flex-col items-center justify-center text-center py-16">
                  <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
                    Unlock Insights From Your Data
                  </h2>
                  <p className="max-w-2xl text-lg text-muted-foreground mb-8">
                    Upload a CSV or Excel file to automatically profile columns, visualize distributions, and analyze trends with AI. Or load a previously saved report.
                  </p>
                  <FileUploader />
                </div>
              )}

               {isLoading && (
                <div className="flex flex-col items-center justify-center text-center py-16">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-12 w-12 animate-spin text-primary" />
                      <p className="text-muted-foreground">
                        {fileName ? `Analyzing "${fileName}"...` : 'Loading...'}
                      </p>
                    </div>
                </div>
               )}

              {parsedData && columnAnalysis && !isLoading && (
                <Dashboard
                  parsedData={parsedData}
                  columnAnalysis={columnAnalysis}
                  fileName={fileName}
                />
              )}
            </div>
          </main>
          
          <footer className="py-6 md:px-8 md:py-0 border-t">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
              <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
                develop with ❤️ by bahman fallahi
              </p>
              <p className="text-sm text-muted-foreground">
                Version {packageJson.version}
              </p>
            </div>
          </footer>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
