'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing AI-powered trading insights and personalized suggestions.
 *
 * The flow takes market data and user portfolio information as input, and returns AI-generated trading insights.
 * It exports:
 * - `getTradingInsights` - A function to trigger the trading insights flow.
 * - `TradingInsightsInput` - The input type for the trading insights function.
 * - `TradingInsightsOutput` - The output type for the trading insights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TradingInsightsInputSchema = z.object({
  marketData: z.string().describe('Real-time market data for various assets.'),
  userPortfolio: z.string().describe('The user\u2019s current portfolio holdings.'),
});
export type TradingInsightsInput = z.infer<typeof TradingInsightsInputSchema>;

const TradingInsightsOutputSchema = z.object({
  insights: z.string().describe('AI-powered insights on market trends and personalized trading suggestions.'),
});
export type TradingInsightsOutput = z.infer<typeof TradingInsightsOutputSchema>;

export async function getTradingInsights(input: TradingInsightsInput): Promise<TradingInsightsOutput> {
  return tradingInsightsFlow(input);
}

const tradingInsightsPrompt = ai.definePrompt({
  name: 'tradingInsightsPrompt',
  input: {schema: TradingInsightsInputSchema},
  output: {schema: TradingInsightsOutputSchema},
  prompt: `You are an AI trading assistant providing personalized trading insights based on market data and user portfolio.

  Analyze the following market data:
  {{marketData}}

  Considering the user's current portfolio:
  {{userPortfolio}}

  Provide concise and actionable trading suggestions to inform their trading decisions within the simulated mode.
  Focus on potential opportunities and risks based on the provided information.
  Format your output as a paragraph.
  `,
});

const tradingInsightsFlow = ai.defineFlow(
  {
    name: 'tradingInsightsFlow',
    inputSchema: TradingInsightsInputSchema,
    outputSchema: TradingInsightsOutputSchema,
  },
  async input => {
    const {output} = await tradingInsightsPrompt(input);
    return output!;
  }
);
