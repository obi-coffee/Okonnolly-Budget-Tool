'use client';

import { useMemo } from 'react';
import { useBudget } from '@/lib/store';
import { estimateAnnualSpending } from '@/lib/calculations';
import Card, { StatCard } from '@/components/Card';
import { fmt, MONTH_NAMES } from '@/lib/format';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

export default function ExpensesPage() {
  const { categories, incomes } = useBudget();

  const spending = useMemo(() => estimateAnnualSpending(categories), [categories]);
  const totalAnnual = spending.reduce((s, c) => s + c.annualTotal, 0);
  const totalMonthlyIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const monthlyExpenses = totalAnnual / 12;
  const surplus = totalMonthlyIncome - monthlyExpenses;

  // Pie chart data
  const pieData = spending
    .filter(s => s.annualTotal > 0)
    .map(s => ({ name: s.category, value: Math.round(s.annualTotal) }));

  // Monthly bar chart data
  const barData = MONTH_NAMES.map((name, i) => {
    const entry: Record<string, string | number> = { month: name };
    for (const s of spending) {
      entry[s.category] = Math.round(s.seasonalMonthly[i]);
    }
    return entry;
  });

  if (categories.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Expense Dashboard</h1>
        <Card>
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No expense data yet. Import bank statements to see your spending breakdown and seasonal estimates.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Expense Dashboard</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Seasonally-adjusted annual spending estimates based on your imported transactions.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Annual Spending" value={fmt(totalAnnual)} />
        <StatCard label="Monthly Avg" value={fmt(monthlyExpenses)} />
        <StatCard label="Monthly Income" value={fmt(totalMonthlyIncome)} />
        <StatCard
          label="Monthly Surplus"
          value={fmt(surplus)}
          sub={surplus >= 0 ? 'Available for debt/savings' : 'Over budget!'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart */}
        <Card title="Spending Breakdown">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => fmt(Number(v))} contentStyle={{ backgroundColor: 'rgba(17,24,39,0.9)', border: 'none', borderRadius: '8px', color: '#e5e7eb' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Category table */}
        <Card title="By Category">
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {spending
              .filter(s => s.annualTotal > 0)
              .sort((a, b) => b.annualTotal - a.annualTotal)
              .map((s, i) => {
                const pct = totalAnnual > 0 ? (s.annualTotal / totalAnnual) * 100 : 0;
                return (
                  <div key={s.category} className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="flex-1 text-sm">{s.category}</span>
                    <span className="text-sm font-medium">{fmt(s.monthlyAvg)}/mo</span>
                    <span className="text-xs text-gray-400 w-12 text-right">{pct.toFixed(1)}%</span>
                  </div>
                );
              })}
          </div>
        </Card>
      </div>

      {/* Monthly seasonal chart */}
      <Card title="Seasonal Spending Estimate (Monthly)">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => fmt(Number(v))} contentStyle={{ backgroundColor: 'rgba(17,24,39,0.9)', border: 'none', borderRadius: '8px', color: '#e5e7eb' }} />
              <Legend />
              {spending
                .filter(s => s.annualTotal > 0)
                .slice(0, 8)
                .map((s, i) => (
                  <Bar key={s.category} dataKey={s.category} stackId="a" fill={COLORS[i % COLORS.length]} />
                ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
