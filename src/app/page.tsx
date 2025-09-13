'use client';

import { useState, useMemo, ChangeEvent } from 'react';
import type { ParsedData, ColumnAnalysis } from '@/lib/data-utils';
import { parseCSV, analyzeColumns } from '@/lib/data-utils';
import Dashboard from '@/components/data-sight/dashboard';
import DataSightLogo from '@/components/data-sight/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, File as FileIcon, Loader2, X } from 'lucide-react';

export default function Home() {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [columnAnalysis, setColumnAnalysis] = useState<ColumnAnalysis[] | null>(null);
  const [csvData, setCsvData] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv') {
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please upload a .csv file.',
      });
      return;
    }

    setIsLoading(true);
    setFileName(file.name);

    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      if (parsed.data.length === 0) {
        throw new Error('CSV file is empty or could not be parsed.');
      }
      const analysis = analyzeColumns(parsed.data, parsed.headers);

      setCsvData(text);
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
    setCsvData('');
    setFileName('');
    setIsLoading(false);
  };
  
  const FileUploader = () => (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative border-2 border-dashed border-muted-foreground/50 rounded-xl p-8 text-center transition-colors hover:border-primary/80 hover:bg-card/50">
        <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">Drag & drop your CSV file</h3>
        <p className="mt-1 text-sm text-muted-foreground">or click to browse</p>
        <Input
          id="file-upload"
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <DataSightLogo className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-primary">DataSight</h1>
          </div>
          {parsedData && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <X className="mr-2 h-4 w-4" />
              Clear Data
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 md:px-6 py-8">
          {!parsedData && (
            <div className="flex flex-col items-center justify-center text-center py-16">
              <h2 className="text-4xl font-extrabold tracking-tight mb-4 text-primary">
                Unlock Insights from Your Sales Data
              </h2>
              <p className="max-w-2xl text-lg text-muted-foreground mb-8">
                Upload a CSV export from Google Sheets to automatically profile columns, visualize distributions, and analyze trends with AI.
              </p>
              {isLoading ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-muted-foreground">Analyzing "{fileName}"...</p>
                </div>
              ) : (
                <FileUploader />
              )}
            </div>
          )}

          {parsedData && columnAnalysis && (
            <Dashboard
              csvData={csvData}
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
        </div>
      </footer>
    </div>
  );
}
