'use client';

import { useState, useMemo } from 'react';
import { v4 as uuid } from 'uuid';
import { useBudget } from '@/lib/store';
import type { Debt } from '@/lib/types';
import { calculateAvalanchePayoff } from '@/lib/calculations';
import Card, { StatCard } from '@/components/Card';
import { fmt, fmtPct } from '@/lib/format';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function DebtsPage() {
  const { debts, setDebts } = useBudget();
  const [editing, setEditing] = useState<string | null>(null);
  const [extraPayment, setExtraPayment] = useState(0);

  const add = () => {
    const d: Debt = { id: uuid(), name: 'New Debt', balance: 0, interestRate: 0, minimumPayment: 0 };
    setDebts([...debts, d]);
    setEditing(d.id);
  };

  const update = (id: string, patch: Partial<Debt>) => {
    setDebts(debts.map(d => (d.id === id ? { ...d, ...patch } : d)));
  };

  const remove = (id: string) => {
    setDebts(debts.filter(d => d.id !== id));
    if (editing === id) setEditing(null);
  };

  const payoff = useMemo(() => calculateAvalanchePayoff(debts, extraPayment), [debts, extraPayment]);
  const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
  const totalMin = debts.reduce((s, d) => s + d.minimumPayment, 0);

  // Build chart data
  const chartData = useMemo(() => {
    if (payoff.schedules.length === 0) return [];
    const maxLen = Math.max(...payoff.schedules.map(s => s.timeline.length));
    const data = [];
    for (let i = 0; i < maxLen; i++) {
      const entry: Record<string, number> = { month: i + 1 };
      for (const s of payoff.schedules) {
        entry[s.debtName] = s.timeline[i]?.balance ?? 0;
      }
      data.push(entry);
    }
    return data;
  }, [payoff]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Debt Manager</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Uses the <strong>avalanche method</strong> — extra payments go to the highest-interest debt first, saving you the most money.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Debt" value={fmt(totalDebt)} />
        <StatCard label="Min Payments" value={`${fmt(totalMin)}/mo`} />
        <StatCard label="Debt-Free In" value={payoff.totalMonths > 0 ? `${payoff.totalMonths} mo` : '—'} sub={payoff.totalMonths > 0 ? `${Math.floor(payoff.totalMonths / 12)}y ${payoff.totalMonths % 12}m` : undefined} />
        <StatCard label="Total Interest" value={fmt(payoff.totalInterest)} />
      </div>

      {/* Extra payment slider */}
      <Card title="Extra Monthly Payment">
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={0}
            max={2000}
            step={25}
            value={extraPayment}
            onChange={e => setExtraPayment(Number(e.target.value))}
            className="flex-1 accent-emerald-500"
          />
          <div className="relative w-28">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              value={extraPayment}
              onChange={e => setExtraPayment(Number(e.target.value))}
              className="w-full pl-6 pr-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </Card>

      {/* Debt list */}
      <Card title="Your Debts">
        <div className="space-y-3">
          {debts
            .slice()
            .sort((a, b) => b.interestRate - a.interestRate)
            .map((d, i) => (
              <div key={d.id} className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {editing === d.id ? (
                  <>
                    <input value={d.name} onChange={e => update(d.id, { name: e.target.value })} className="flex-1 min-w-[120px] px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Name" />
                    <label className="text-xs text-gray-500">Balance</label>
                    <input type="number" value={d.balance || ''} onChange={e => update(d.id, { balance: Number(e.target.value) })} className="w-24 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    <label className="text-xs text-gray-500">APR %</label>
                    <input type="number" step="0.1" value={d.interestRate || ''} onChange={e => update(d.id, { interestRate: Number(e.target.value) })} className="w-20 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    <label className="text-xs text-gray-500">Min Pay</label>
                    <input type="number" value={d.minimumPayment || ''} onChange={e => update(d.id, { minimumPayment: Number(e.target.value) })} className="w-24 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    <button onClick={() => setEditing(null)} className="text-emerald-500 text-sm font-medium">Done</button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium">{d.name}</span>
                    <span className="text-sm">{fmt(d.balance)}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{fmtPct(d.interestRate)} APR</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{fmt(d.minimumPayment)}/mo min</span>
                    <button onClick={() => setEditing(d.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm">Edit</button>
                    <button onClick={() => remove(d.id)} className="text-red-400 hover:text-red-500 text-sm">×</button>
                  </>
                )}
              </div>
            ))}

          <button
            onClick={add}
            className="w-full py-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 text-sm text-gray-500 hover:border-emerald-500 hover:text-emerald-500 transition-colors"
          >
            + Add Debt
          </button>
        </div>
      </Card>

      {/* Payoff timeline chart */}
      {chartData.length > 0 && (
        <Card title="Payoff Timeline">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} label={{ value: 'Months', position: 'insideBottom', offset: -5 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => fmt(Number(v))} labelFormatter={l => `Month ${l}`} contentStyle={{ backgroundColor: 'rgba(17,24,39,0.9)', border: 'none', borderRadius: '8px', color: '#e5e7eb' }} />
                <Legend />
                {payoff.schedules.map((s, i) => (
                  <Area
                    key={s.debtId}
                    type="monotone"
                    dataKey={s.debtName}
                    stackId="1"
                    stroke={COLORS[i % COLORS.length]}
                    fill={COLORS[i % COLORS.length]}
                    fillOpacity={0.3}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Individual payoff dates */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {payoff.schedules
              .sort((a, b) => a.months - b.months)
              .map((s, i) => (
                <div key={s.debtId} className="flex items-center gap-2 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="flex-1">{s.debtName}</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {s.payoffDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                  <span className="text-xs text-gray-400">({s.months} mo)</span>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
