'use client';
import { useState } from 'react';
import { analyzeSalesTrends } from '@/ai/flows/analyze-sales-trends';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Loader2 } from 'lucide-react';

interface AiAnalysisProps {
  csvData: string;
}

export default function AiAnalysis({ csvData }: AiAnalysisProps) {
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    setIsLoading(true);
    setAnalysis('');
    try {
      const result = await analyzeSalesTrends({ csvData });
      setAnalysis(result.analysis);
    } catch (error) {
      console.error('AI analysis failed:', error);
      toast({
        variant: 'destructive',
        title: 'AI Analysis Failed',
        description: 'Could not generate trend analysis. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span>AI Trend Analysis</span>
        </CardTitle>
        <CardDescription>
          Identify patterns, seasonality, and correlations in your data.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        {isLoading ? (
          <div className="space-y-4 flex-grow">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex justify-center items-center flex-grow">
               <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
        ) : analysis ? (
          <ScrollArea className="h-64">
            <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap font-sans text-sm text-foreground">
              {analysis}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg flex-grow">
            <p className="text-sm text-muted-foreground">Click the button to generate an AI-powered analysis of your sales data.</p>
          </div>
        )}
        <Button onClick={handleAnalyze} disabled={isLoading} className="mt-4 w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze Sales Trends
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
