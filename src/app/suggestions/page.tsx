'use client';

import { useMemo } from 'react';
import { useBudget } from '@/lib/store';
import { generateSuggestions, calculateAvalanchePayoff } from '@/lib/calculations';
import Card, { StatCard } from '@/components/Card';
import { fmt } from '@/lib/format';

export default function SuggestionsPage() {
  const { categories, debts, incomes } = useBudget();
  const totalMonthlyIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const basePayoff = useMemo(() => calculateAvalanchePayoff(debts), [debts]);

  const suggestions = useMemo(
    () => generateSuggestions(categories, debts, totalMonthlyIncome),
    [categories, debts, totalMonthlyIncome],
  );

  if (debts.length === 0 || categories.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Smart Suggestions</h1>
        <Card>
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            Add debts and import expenses to receive personalized suggestions.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Smart Suggestions</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Actionable tips to accelerate your debt payoff. Each suggestion shows exactly how many months faster you&apos;d be debt-free.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Current Payoff" value={`${basePayoff.totalMonths} mo`} sub={`${Math.floor(basePayoff.totalMonths / 12)}y ${basePayoff.totalMonths % 12}m`} />
        <StatCard label="Total Interest" value={fmt(basePayoff.totalInterest)} />
        <StatCard label="Suggestions" value={`${suggestions.length}`} />
      </div>

      <div className="space-y-3">
        {suggestions.map((s, i) => (
          <Card key={s.id}>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                s.monthsFaster >= 6 ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' :
                s.monthsFaster >= 3 ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' :
                'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}>
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{s.text}</p>
                <div className="flex flex-wrap gap-4 mt-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                    Debt-free {s.monthsFaster} months faster
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    Save {fmt(s.monthlySavings)}/mo
                  </span>
                  {s.category && (
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                      {s.category}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">-{s.monthsFaster}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">months</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
