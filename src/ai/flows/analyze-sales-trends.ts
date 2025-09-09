// src/ai/flows/analyze-sales-trends.ts
'use server';

/**
 * @fileOverview Analyzes sales data to identify trends, seasonal variations, and correlations.
 *
 * - analyzeSalesTrends - A function that takes CSV data as input and returns an analysis of sales trends.
 * - AnalyzeSalesTrendsInput - The input type for the analyzeSalesTrends function.
 * - AnalyzeSalesTrendsOutput - The return type for the analyzeSalesTrends function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeSalesTrendsInputSchema = z.object({
  csvData: z.string().describe('Sales data in CSV format.'),
});
export type AnalyzeSalesTrendsInput = z.infer<typeof AnalyzeSalesTrendsInputSchema>;

const AnalyzeSalesTrendsOutputSchema = z.object({
  analysis: z.string().describe('Analysis of sales trends, seasonal variations, and correlations.'),
});
export type AnalyzeSalesTrendsOutput = z.infer<typeof AnalyzeSalesTrendsOutputSchema>;

export async function analyzeSalesTrends(input: AnalyzeSalesTrendsInput): Promise<AnalyzeSalesTrendsOutput> {
  return analyzeSalesTrendsFlow(input);
}

const analyzeSalesTrendsPrompt = ai.definePrompt({
  name: 'analyzeSalesTrendsPrompt',
  input: {schema: AnalyzeSalesTrendsInputSchema},
  output: {schema: AnalyzeSalesTrendsOutputSchema},
  prompt: `You are an expert data analyst with a deep understanding of sales trends and patterns.

  Analyze the following sales data provided in CSV format to identify key trends, seasonal variations, and correlations between different data columns. Provide a concise and informative summary of your findings. Focus on actionable insights that can help improve sales performance. If the CSV data has dates, be sure to consider how sales change over time.

  CSV Data:
  {{csvData}}`,
});

const analyzeSalesTrendsFlow = ai.defineFlow(
  {
    name: 'analyzeSalesTrendsFlow',
    inputSchema: AnalyzeSalesTrendsInputSchema,
    outputSchema: AnalyzeSalesTrendsOutputSchema,
  },
  async input => {
    const {output} = await analyzeSalesTrendsPrompt(input);
    return output!;
  }
);
