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
  prompt: `You are a Senior Quantitative Trading Analyst. Your task is to provide deep, data-driven trading insights based on current market data and a user's specific portfolio.

  ### Context
  Market Data:
  {{marketData}}

  User Portfolio:
  {{userPortfolio}}

  ### Objectives
  1. **Identify Performance Drivers**: Analyze which assets in the portfolio are driving gains or losses.
  2. **Spot Market Opportunities**: Identify high-momentum assets or potential "buy the dip" opportunities from the market data.
  3. **Risk Management**: Flag over-concentration or high-risk positions (especially in volatile assets like Crypto).
  4. **Actionable Advice**: Provide specific, quantitative suggestions (e.g., "Consider trimming your position in X to lock in 10% gains" or "Asset Y is down 5% today despite strong fundamentals, potentially a entry point").

  ### Guidelines
  - Be direct, professional, and slightly analytical.
  - Avoid generic advice like "diversify your portfolio" unless it's backed by a specific observation (e.g., "You are 90% invested in Tech").
  - Use the specific price points and percentages provided in the data.
  - Format the response as a single, well-structured paragraph.
  - Ensure the advice is tailored to a simulated trading environment where users are learning.
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
