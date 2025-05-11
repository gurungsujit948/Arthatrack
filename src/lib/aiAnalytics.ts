import * as tf from '@tensorflow/tfjs';
import SimpleLinearRegression from 'ml-regression-simple-linear';
import { Transaction } from '../types';
import { format, subMonths, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';

export interface SpendingInsight {
  type: 'warning' | 'success' | 'info';
  message: string;
  value?: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface CategoryPrediction {
  categoryId: number;
  predictedAmount: number;
  confidence: number;
}

export function analyzeSpendingPatterns(transactions: Transaction[]): SpendingInsight[] {
  const insights: SpendingInsight[] = [];
  
  // Calculate monthly spending trends
  const monthlySpending = calculateMonthlySpending(transactions);
  const spendingTrend = analyzeSpendingTrend(monthlySpending);
  
  // Unusual spending detection
  const unusualCategories = detectUnusualSpending(transactions);
  
  // Add spending trend insight
  if (spendingTrend.trend === 'up' && spendingTrend.percentage > 10) {
    insights.push({
      type: 'warning',
      message: `Your spending has increased by ${spendingTrend.percentage.toFixed(1)}% compared to last month`,
      value: spendingTrend.percentage,
      trend: 'up'
    });
  } else if (spendingTrend.trend === 'down' && spendingTrend.percentage > 10) {
    insights.push({
      type: 'success',
      message: `Great job! You've reduced spending by ${spendingTrend.percentage.toFixed(1)}% compared to last month`,
      value: spendingTrend.percentage,
      trend: 'down'
    });
  }
  
  // Add unusual spending insights
  unusualCategories.forEach(category => {
    insights.push({
      type: 'warning',
      message: `Unusual spending detected in ${category.name}: ${category.percentage.toFixed(1)}% higher than average`,
      value: category.percentage,
      trend: 'up'
    });
  });
  
  // Add savings opportunities
  const savingsOpportunities = findSavingsOpportunities(transactions);
  savingsOpportunities.forEach(opportunity => {
    insights.push({
      type: 'info',
      message: opportunity.message,
      value: opportunity.potentialSavings
    });
  });
  
  return insights;
}

export async function predictNextMonthSpending(transactions: Transaction[]): Promise<CategoryPrediction[]> {
  const predictions: CategoryPrediction[] = [];
  
  // Group transactions by category
  const categoryGroups = groupTransactionsByCategory(transactions);
  
  for (const [categoryId, categoryTransactions] of Object.entries(categoryGroups)) {
    const monthlyAmounts = calculateMonthlyAmounts(categoryTransactions);
    
    if (monthlyAmounts.length >= 3) {
      // Prepare data for regression
      const x = monthlyAmounts.map((_, index) => index);
      const y = monthlyAmounts;
      
      // Create and train regression model
      const regression = new SimpleLinearRegression(x, y);
      
      // Predict next month
      const nextMonthPrediction = regression.predict(monthlyAmounts.length);
      
      // Calculate confidence based on R-squared value
      const confidence = Math.max(0, Math.min(1, regression.score(x, y)));
      
      predictions.push({
        categoryId: parseInt(categoryId),
        predictedAmount: Math.max(0, nextMonthPrediction), // Ensure non-negative
        confidence
      });
    }
  }
  
  return predictions;
}

function calculateMonthlySpending(transactions: Transaction[]): Map<string, number> {
  const monthlySpending = new Map<string, number>();
  
  transactions.forEach(transaction => {
    if (transaction.type === 'expense') {
      const monthKey = format(new Date(transaction.date), 'yyyy-MM');
      const currentAmount = monthlySpending.get(monthKey) || 0;
      monthlySpending.set(monthKey, currentAmount + transaction.amount);
    }
  });
  
  return monthlySpending;
}

function analyzeSpendingTrend(monthlySpending: Map<string, number>) {
  const currentMonth = format(new Date(), 'yyyy-MM');
  const lastMonth = format(subMonths(new Date(), 1), 'yyyy-MM');
  
  const currentSpending = monthlySpending.get(currentMonth) || 0;
  const lastSpending = monthlySpending.get(lastMonth) || 0;
  
  if (lastSpending === 0) return { trend: 'stable', percentage: 0 };
  
  const percentageChange = ((currentSpending - lastSpending) / lastSpending) * 100;
  
  return {
    trend: percentageChange > 0 ? 'up' : 'down',
    percentage: Math.abs(percentageChange)
  };
}

function detectUnusualSpending(transactions: Transaction[]) {
  const unusualCategories: Array<{ name: string; percentage: number }> = [];
  const categoryGroups = groupTransactionsByCategory(transactions);
  
  for (const [categoryId, categoryTransactions] of Object.entries(categoryGroups)) {
    const monthlyAverages = calculateMonthlyAverages(categoryTransactions);
    const currentMonthSpending = calculateCurrentMonthSpending(categoryTransactions);
    
    if (monthlyAverages.length >= 3) {
      const average = monthlyAverages.reduce((sum, val) => sum + val, 0) / monthlyAverages.length;
      const standardDev = calculateStandardDeviation(monthlyAverages);
      
      if (currentMonthSpending > average + 2 * standardDev) {
        const percentage = ((currentMonthSpending - average) / average) * 100;
        unusualCategories.push({
          name: categoryTransactions[0].category?.name || 'Uncategorized',
          percentage
        });
      }
    }
  }
  
  return unusualCategories;
}

function findSavingsOpportunities(transactions: Transaction[]) {
  const opportunities = [];
  const categoryGroups = groupTransactionsByCategory(transactions);
  
  for (const [categoryId, categoryTransactions] of Object.entries(categoryGroups)) {
    const monthlyAmounts = calculateMonthlyAmounts(categoryTransactions);
    
    if (monthlyAmounts.length >= 3) {
      const average = monthlyAmounts.reduce((sum, val) => sum + val, 0) / monthlyAmounts.length;
      const minimum = Math.min(...monthlyAmounts);
      
      if (minimum < average * 0.7) {
        const potentialSavings = average - minimum;
        opportunities.push({
          message: `You've spent as low as £${minimum.toFixed(2)} on ${categoryTransactions[0].category?.name || 'Uncategorized'} before. Targeting this could save you £${potentialSavings.toFixed(2)} per month.`,
          potentialSavings
        });
      }
    }
  }
  
  return opportunities;
}

// Helper functions
function groupTransactionsByCategory(transactions: Transaction[]) {
  return transactions.reduce((groups, transaction) => {
    if (transaction.type === 'expense') {
      const categoryId = transaction.category_id;
      if (!groups[categoryId]) {
        groups[categoryId] = [];
      }
      groups[categoryId].push(transaction);
    }
    return groups;
  }, {} as Record<number, Transaction[]>);
}

function calculateMonthlyAmounts(transactions: Transaction[]) {
  const monthlyAmounts = new Map<string, number>();
  
  transactions.forEach(transaction => {
    const monthKey = format(new Date(transaction.date), 'yyyy-MM');
    const currentAmount = monthlyAmounts.get(monthKey) || 0;
    monthlyAmounts.set(monthKey, currentAmount + transaction.amount);
  });
  
  return Array.from(monthlyAmounts.values());
}

function calculateMonthlyAverages(transactions: Transaction[]) {
  const monthlyAmounts = calculateMonthlyAmounts(transactions);
  return monthlyAmounts.slice(0, -1); // Exclude current month
}

function calculateCurrentMonthSpending(transactions: Transaction[]) {
  const currentMonth = new Date();
  return transactions
    .filter(t => isWithinInterval(new Date(t.date), {
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth)
    }))
    .reduce((sum, t) => sum + t.amount, 0);
}

function calculateStandardDeviation(values: number[]) {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.sqrt(variance);
}