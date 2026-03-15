import type { Debt, CategorySummary, Suggestion } from './types';
import { SEASONAL_WEIGHTS } from './types';

// ─── Avalanche method debt paydown ──────────────────────────────────

export interface PayoffSchedule {
  debtId: string;
  debtName: string;
  months: number;
  payoffDate: Date;
  totalInterest: number;
  timeline: { month: number; balance: number; payment: number; interest: number }[];
}

export function calculateAvalanchePayoff(
  debts: Debt[],
  extraMonthly: number = 0,
): { schedules: PayoffSchedule[]; totalMonths: number; totalInterest: number } {
  if (debts.length === 0) return { schedules: [], totalMonths: 0, totalInterest: 0 };

  // Clone debts for simulation
  const active = debts.map(d => ({
    ...d,
    remaining: d.balance,
    timeline: [] as PayoffSchedule['timeline'],
    totalInterest: 0,
    paidOff: false,
    paidOffMonth: 0,
  }));

  const totalMinPayments = debts.reduce((s, d) => s + d.minimumPayment, 0);
  let totalBudget = totalMinPayments + extraMonthly;
  let month = 0;
  const maxMonths = 600; // 50 year cap

  while (active.some(d => !d.paidOff) && month < maxMonths) {
    month++;
    let budgetRemaining = totalBudget;

    // 1. Apply interest
    for (const d of active) {
      if (d.paidOff) continue;
      const interest = (d.remaining * (d.interestRate / 100)) / 12;
      d.remaining += interest;
      d.totalInterest += interest;
    }

    // 2. Pay minimums
    for (const d of active) {
      if (d.paidOff) continue;
      const payment = Math.min(d.minimumPayment, d.remaining);
      d.remaining -= payment;
      budgetRemaining -= payment;
      if (d.remaining <= 0.01) {
        d.remaining = 0;
        d.paidOff = true;
        d.paidOffMonth = month;
        budgetRemaining += d.minimumPayment; // freed up
      }
      d.timeline.push({
        month,
        balance: Math.max(0, d.remaining),
        payment,
        interest: (d.remaining * (d.interestRate / 100)) / 12,
      });
    }

    // 3. Extra goes to highest-rate debt (avalanche)
    const sorted = active
      .filter(d => !d.paidOff)
      .sort((a, b) => b.interestRate - a.interestRate);

    for (const d of sorted) {
      if (budgetRemaining <= 0) break;
      const extra = Math.min(budgetRemaining, d.remaining);
      d.remaining -= extra;
      budgetRemaining -= extra;
      // update last timeline entry
      const last = d.timeline[d.timeline.length - 1];
      if (last) {
        last.payment += extra;
        last.balance = Math.max(0, d.remaining);
      }
      if (d.remaining <= 0.01) {
        d.remaining = 0;
        d.paidOff = true;
        d.paidOffMonth = month;
      }
    }
  }

  const schedules: PayoffSchedule[] = active.map(d => ({
    debtId: d.id,
    debtName: d.name,
    months: d.paidOffMonth || maxMonths,
    payoffDate: new Date(Date.now() + (d.paidOffMonth || maxMonths) * 30.44 * 24 * 60 * 60 * 1000),
    totalInterest: d.totalInterest,
    timeline: d.timeline,
  }));

  return {
    schedules,
    totalMonths: Math.max(...schedules.map(s => s.months)),
    totalInterest: schedules.reduce((s, d) => s + d.totalInterest, 0),
  };
}

// ─── Seasonal estimation ────────────────────────────────────────────

export function estimateAnnualSpending(categories: CategorySummary[]): {
  category: string;
  monthlyAvg: number;
  seasonalMonthly: number[];
  annualTotal: number;
}[] {
  return categories.map(cat => {
    const nonZero = cat.monthly.filter(m => m > 0);
    const monthlyAvg = nonZero.length > 0 ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length : 0;
    const weights = SEASONAL_WEIGHTS[cat.category] || Array(12).fill(1);
    const seasonalMonthly = weights.map(w => monthlyAvg * w);
    const annualTotal = seasonalMonthly.reduce((a, b) => a + b, 0);
    return { category: cat.category, monthlyAvg, seasonalMonthly, annualTotal };
  });
}

// ─── Smart suggestions ──────────────────────────────────────────────

export function generateSuggestions(
  categories: CategorySummary[],
  debts: Debt[],
  totalMonthlyIncome: number,
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const basePayoff = calculateAvalanchePayoff(debts);

  // Discretionary categories that can be cut
  const discretionary = ['Dining Out', 'Entertainment', 'Shopping', 'Subscriptions', 'Personal Care', 'Travel'];

  for (const cat of categories) {
    if (!discretionary.includes(cat.category)) continue;
    const nonZero = cat.monthly.filter(m => m > 0);
    if (nonZero.length === 0) continue;
    const avg = nonZero.reduce((a, b) => a + b, 0) / nonZero.length;
    if (avg < 20) continue;

    for (const pct of [10, 25, 50]) {
      const savings = Math.round(avg * pct / 100);
      const newPayoff = calculateAvalanchePayoff(debts, savings);
      const monthsFaster = basePayoff.totalMonths - newPayoff.totalMonths;
      if (monthsFaster > 0) {
        suggestions.push({
          id: `${cat.category}-${pct}`,
          text: `Reduce ${cat.category} by ${pct}% ($${savings}/mo)`,
          monthlySavings: savings,
          monthsFaster,
          category: cat.category,
        });
      }
    }
  }

  // Income-based suggestions
  for (const extra of [200, 500, 1000]) {
    if (extra > totalMonthlyIncome * 0.5) continue;
    const newPayoff = calculateAvalanchePayoff(debts, extra);
    const monthsFaster = basePayoff.totalMonths - newPayoff.totalMonths;
    if (monthsFaster > 0) {
      suggestions.push({
        id: `income-${extra}`,
        text: `Add $${extra}/mo extra income`,
        monthlySavings: extra,
        monthsFaster,
      });
    }
  }

  // Sort by months faster descending
  suggestions.sort((a, b) => b.monthsFaster - a.monthsFaster);
  return suggestions.slice(0, 15);
}

// ─── Post-debt savings projections ──────────────────────────────────

export function projectSavings(
  monthlyContribution: number,
  annualReturn: number,
  years: number,
): { year: number; balance: number; contributions: number; growth: number }[] {
  const results: { year: number; balance: number; contributions: number; growth: number }[] = [];
  let balance = 0;
  const monthlyRate = annualReturn / 100 / 12;

  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + monthlyRate) + monthlyContribution;
    }
    const totalContributions = monthlyContribution * 12 * y;
    results.push({
      year: y,
      balance: Math.round(balance),
      contributions: Math.round(totalContributions),
      growth: Math.round(balance - totalContributions),
    });
  }
  return results;
}
