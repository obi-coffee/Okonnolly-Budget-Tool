'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useBudget } from '@/lib/store';
import { calculateAvalanchePayoff, estimateAnnualSpending, generateSuggestions } from '@/lib/calculations';
import Card, { StatCard } from '@/components/Card';
import { fmt } from '@/lib/format';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function DashboardPage() {
  const { incomes, debts, categories, partnerNames } = useBudget();

  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
  const payoff = useMemo(() => calculateAvalanchePayoff(debts), [debts]);
  const spending = useMemo(() => estimateAnnualSpending(categories), [categories]);
  const monthlyExpenses = spending.reduce((s, c) => s + c.annualTotal, 0) / 12;
  const surplus = totalIncome - monthlyExpenses;

  const suggestions = useMemo(
    () => generateSuggestions(categories, debts, totalIncome),
    [categories, debts, totalIncome],
  );

  const incomeBreakdown = [
    { name: partnerNames[0], value: incomes.filter(i => i.owner === 'partner1').reduce((s, i) => s + i.amount, 0) },
    { name: partnerNames[1], value: incomes.filter(i => i.owner === 'partner2').reduce((s, i) => s + i.amount, 0) },
  ].filter(d => d.value > 0);

  const hasData = totalIncome > 0 || totalDebt > 0 || categories.length > 0;

  if (!hasData) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-16">
          <h1 className="text-3xl font-bold mb-2">O&apos;Konnolly Budget Tool</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Proactive budgeting for couples. Pay down debt together, build wealth, and keep your lifestyle.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <Link href="/income" className="p-5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-emerald-500 transition-colors group">
              <p className="text-2xl mb-2">$</p>
              <p className="font-medium text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400">1. Add Income</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Both salaries + side income</p>
            </Link>
            <Link href="/debts" className="p-5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-emerald-500 transition-colors group">
              <p className="text-2xl mb-2">⊟</p>
              <p className="font-medium text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400">2. Add Debts</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Credit cards, loans, etc.</p>
            </Link>
            <Link href="/import" className="p-5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-emerald-500 transition-colors group">
              <p className="text-2xl mb-2">↑</p>
              <p className="font-medium text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400">3. Import Expenses</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Upload bank CSV statements</p>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Key stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Monthly Income" value={fmt(totalIncome)} />
        <StatCard label="Monthly Expenses" value={fmt(monthlyExpenses)} />
        <StatCard
          label="Monthly Surplus"
          value={fmt(surplus)}
          sub={surplus >= 0 ? 'For debt & savings' : 'Over budget'}
        />
        <StatCard
          label="Debt-Free In"
          value={payoff.totalMonths > 0 ? `${payoff.totalMonths} mo` : totalDebt > 0 ? 'Add min payments' : 'No debt!'}
          sub={payoff.totalMonths > 0 ? payoff.schedules[0]?.payoffDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income split */}
        {incomeBreakdown.length > 0 && (
          <Card title="Income Split">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    label={({ name, value }) => `${name}: ${fmt(value)}`}
                    labelLine={false}
                  >
                    {incomeBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(Number(v))} contentStyle={{ backgroundColor: 'rgba(17,24,39,0.9)', border: 'none', borderRadius: '8px', color: '#e5e7eb' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Debt overview */}
        {debts.length > 0 && (
          <Card title="Debt Overview">
            <div className="space-y-3">
              {debts
                .slice()
                .sort((a, b) => b.interestRate - a.interestRate)
                .map(d => (
                  <div key={d.id} className="flex items-center gap-3">
                    <span className="flex-1 text-sm">{d.name}</span>
                    <span className="text-sm font-medium">{fmt(d.balance)}</span>
                    <span className="text-xs text-gray-400">{d.interestRate}%</span>
                  </div>
                ))}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-800 flex justify-between">
                <span className="text-sm font-medium">Total</span>
                <span className="text-sm font-bold text-red-500">{fmt(totalDebt)}</span>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Top suggestions */}
      {suggestions.length > 0 && (
        <Card title="Top Suggestions">
          <div className="space-y-3">
            {suggestions.slice(0, 3).map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <span className="flex-1 text-sm">{s.text}</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                  -{s.monthsFaster} mo
                </span>
              </div>
            ))}
          </div>
          <Link href="/suggestions" className="block text-center text-sm text-emerald-600 dark:text-emerald-400 mt-3 hover:underline">
            View all suggestions →
          </Link>
        </Card>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/income', label: 'Manage Income', icon: '$' },
          { href: '/debts', label: 'Manage Debts', icon: '⊟' },
          { href: '/scenarios', label: 'What-If Scenarios', icon: '?' },
          { href: '/projections', label: 'Future Savings', icon: '∞' },
        ].map(l => (
          <Link
            key={l.href}
            href={l.href}
            className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-emerald-500 transition-colors text-center"
          >
            <p className="text-xl mb-1">{l.icon}</p>
            <p className="text-xs font-medium">{l.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
