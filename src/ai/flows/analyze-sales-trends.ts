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
  prompt: `
  You are an expert data analyst, and your response MUST be in Persian.
  Your goal is to analyze the provided sales data and generate a formal report that can be presented to a senior manager.

  The analysis should be based ENTIRELY on the data from the CSV file. Perform a monthly analysis covering the following points:
  - Which expert was most effective?
  - Which introduction channel had the most feedback?
  - Which day of the week had the most sales?
  - Which week of the month had the weakest sales?
  - Which regions had the highest share and which regions had the lowest share of sales?
  - Identify any other significant patterns or insights from the data.
  
  IMPORTANT: The date format in the data is Solar Hijri (YYYY/MM/DD). Your monthly analysis must use the correct Persian month names. For example, a date like '1404/05/01' is in the month of Mordad (05), not Farvardin (01). Ensure your report accurately reflects the correct Solar month for the data provided.

  Here are some crucial details about interpreting the data:
  - In column 4, a value of "Free" means the customer was exempted from a 1,650,000 Toman fee for fiber extraction.
  - In column 4, a value of "Have" also means the customer already had fiber and was exempt from the fee. These should not be counted in the total fiber extraction calculations.
  - Your final report should be well-structured, clear, and professional.

  CSV Data:
  {{csvData}}
  `,
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
