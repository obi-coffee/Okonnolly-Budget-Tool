'use client';

import { useState, useMemo } from 'react';
import { useBudget } from '@/lib/store';
import { calculateAvalanchePayoff, projectSavings } from '@/lib/calculations';
import Card, { StatCard } from '@/components/Card';
import { fmt, fmtPct } from '@/lib/format';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

export default function ProjectionsPage() {
  const { debts, incomes } = useBudget();
  const [annualReturn, setAnnualReturn] = useState(7);
  const [years, setYears] = useState(30);
  const [extraContribution, setExtraContribution] = useState(0);

  const totalMinPayments = debts.reduce((s, d) => s + d.minimumPayment, 0);
  const payoff = useMemo(() => calculateAvalanchePayoff(debts), [debts]);

  // After debt is paid off, the min payments become available for investing
  const monthlyFromDebt = totalMinPayments;
  const totalMonthlyContribution = monthlyFromDebt + extraContribution;

  const projection = useMemo(
    () => projectSavings(totalMonthlyContribution, annualReturn, years),
    [totalMonthlyContribution, annualReturn, years],
  );

  const chartData = projection.map(p => ({
    year: p.year,
    Contributions: p.contributions,
    Growth: p.growth,
    Total: p.balance,
  }));

  const finalBalance = projection[projection.length - 1]?.balance || 0;
  const totalContributed = projection[projection.length - 1]?.contributions || 0;
  const totalGrowth = projection[projection.length - 1]?.growth || 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Post-Debt Savings Projections</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Once you&apos;re debt-free, your monthly debt payments become investment capital. See what compound growth at market returns can build.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Monthly from Debt" value={fmt(monthlyFromDebt)} sub="Freed-up payments" />
        <StatCard label="Total Monthly" value={fmt(totalMonthlyContribution)} sub="Contributions" />
        <StatCard
          label="Debt-Free In"
          value={payoff.totalMonths > 0 ? `${payoff.totalMonths} mo` : 'No debt'}
          sub={payoff.totalMonths > 0 ? `Then investing begins` : undefined}
        />
        <StatCard label={`${years}-Year Balance`} value={fmt(finalBalance)} />
      </div>

      {/* Controls */}
      <Card title="Projection Settings">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Annual Return: {fmtPct(annualReturn)}</label>
            <input
              type="range"
              min={1}
              max={12}
              step={0.5}
              value={annualReturn}
              onChange={e => setAnnualReturn(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1%</span>
              <span>Conservative 4-5%</span>
              <span>12%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Time Horizon: {years} years</label>
            <input
              type="range"
              min={5}
              max={40}
              value={years}
              onChange={e => setYears(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>5y</span>
              <span>20y</span>
              <span>40y</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Extra Monthly: {fmt(extraContribution)}</label>
            <input
              type="range"
              min={0}
              max={2000}
              step={50}
              value={extraContribution}
              onChange={e => setExtraContribution(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>$0</span>
              <span>$1,000</span>
              <span>$2,000</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Chart */}
      <Card title="Wealth Growth Over Time">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <XAxis dataKey="year" tick={{ fontSize: 12 }} label={{ value: 'Years', position: 'insideBottom', offset: -5 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => fmt(Number(v))} contentStyle={{ backgroundColor: 'rgba(17,24,39,0.9)', border: 'none', borderRadius: '8px', color: '#e5e7eb' }} />
              <Legend />
              <Area type="monotone" dataKey="Contributions" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
              <Area type="monotone" dataKey="Growth" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Summary table */}
      <Card title="Milestones">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                <th className="py-2 pr-4">Year</th>
                <th className="py-2 pr-4 text-right">Contributed</th>
                <th className="py-2 pr-4 text-right">Growth</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {projection
                .filter((_, i) => (i + 1) % 5 === 0 || i === 0 || i === projection.length - 1)
                .map(p => (
                  <tr key={p.year} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="py-2 pr-4 font-medium">Year {p.year}</td>
                    <td className="py-2 pr-4 text-right">{fmt(p.contributions)}</td>
                    <td className="py-2 pr-4 text-right text-emerald-600 dark:text-emerald-400">{fmt(p.growth)}</td>
                    <td className="py-2 text-right font-bold">{fmt(p.balance)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Final summary */}
      <Card>
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            By investing {fmt(totalMonthlyContribution)}/mo at {fmtPct(annualReturn)} returns for {years} years:
          </p>
          <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{fmt(finalBalance)}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {fmt(totalContributed)} contributed · {fmt(totalGrowth)} from market growth
          </p>
        </div>
      </Card>
    </div>
  );
}
