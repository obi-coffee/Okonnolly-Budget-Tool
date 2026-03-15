'use client';

import { useState, useMemo } from 'react';
import { v4 as uuid } from 'uuid';
import { useBudget } from '@/lib/store';
import type { Scenario, ScenarioChange } from '@/lib/types';
import { calculateAvalanchePayoff } from '@/lib/calculations';
import Card, { StatCard } from '@/components/Card';
import { fmt } from '@/lib/format';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

export default function ScenariosPage() {
  const { debts, categories, scenarios, setScenarios } = useBudget();
  const [activeId, setActiveId] = useState<string | null>(null);

  const basePayoff = useMemo(() => calculateAvalanchePayoff(debts), [debts]);

  const addScenario = () => {
    const s: Scenario = { id: uuid(), name: 'New Scenario', changes: [] };
    setScenarios([...scenarios, s]);
    setActiveId(s.id);
  };

  const updateScenario = (id: string, patch: Partial<Scenario>) => {
    setScenarios(scenarios.map(s => (s.id === id ? { ...s, ...patch } : s)));
  };

  const removeScenario = (id: string) => {
    setScenarios(scenarios.filter(s => s.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const addChange = (scenarioId: string) => {
    const s = scenarios.find(x => x.id === scenarioId);
    if (!s) return;
    const change: ScenarioChange = { type: 'expense_cut', category: 'Dining Out', amount: 50, description: 'Reduce dining out' };
    updateScenario(scenarioId, { changes: [...s.changes, change] });
  };

  const updateChange = (scenarioId: string, idx: number, patch: Partial<ScenarioChange>) => {
    const s = scenarios.find(x => x.id === scenarioId);
    if (!s) return;
    const changes = s.changes.map((c, i) => (i === idx ? { ...c, ...patch } : c));
    updateScenario(scenarioId, { changes });
  };

  const removeChange = (scenarioId: string, idx: number) => {
    const s = scenarios.find(x => x.id === scenarioId);
    if (!s) return;
    updateScenario(scenarioId, { changes: s.changes.filter((_, i) => i !== idx) });
  };

  // Calculate scenario impacts
  const scenarioResults = useMemo(() => {
    return scenarios.map(s => {
      const extra = s.changes.reduce((sum, c) => sum + c.amount, 0);
      const result = calculateAvalanchePayoff(debts, extra);
      const monthsSaved = basePayoff.totalMonths - result.totalMonths;
      const interestSaved = basePayoff.totalInterest - result.totalInterest;
      return { scenario: s, extra, result, monthsSaved, interestSaved };
    });
  }, [scenarios, debts, basePayoff]);

  // Comparison chart data
  const comparisonData = useMemo(() => {
    const data = [{ name: 'Current Plan', months: basePayoff.totalMonths, interest: Math.round(basePayoff.totalInterest) }];
    for (const r of scenarioResults) {
      data.push({ name: r.scenario.name, months: r.result.totalMonths, interest: Math.round(r.result.totalInterest) });
    }
    return data;
  }, [basePayoff, scenarioResults]);

  const active = scenarios.find(s => s.id === activeId);
  const catNames = categories.map(c => c.category);

  if (debts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">What-If Scenarios</h1>
        <Card>
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            Add debts first to explore what-if scenarios.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">What-If Scenarios</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Model changes to your expenses or income and see how they impact your debt payoff timeline.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Current Payoff" value={`${basePayoff.totalMonths} months`} />
        <StatCard label="Total Interest" value={fmt(basePayoff.totalInterest)} />
        <StatCard label="Scenarios" value={`${scenarios.length}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario list */}
        <div className="space-y-3">
          {scenarios.map(s => {
            const result = scenarioResults.find(r => r.scenario.id === s.id);
            return (
              <button
                key={s.id}
                onClick={() => setActiveId(s.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  activeId === s.id
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                }`}
              >
                <p className="text-sm font-medium">{s.name}</p>
                {result && result.monthsSaved > 0 && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    {result.monthsSaved} months faster · Save {fmt(result.interestSaved)} interest
                  </p>
                )}
              </button>
            );
          })}
          <button
            onClick={addScenario}
            className="w-full py-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 text-sm text-gray-500 hover:border-emerald-500 hover:text-emerald-500 transition-colors"
          >
            + New Scenario
          </button>
        </div>

        {/* Active scenario editor */}
        <div className="lg:col-span-2">
          {active ? (
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <input
                  value={active.name}
                  onChange={e => updateScenario(active.id, { name: e.target.value })}
                  className="flex-1 text-lg font-semibold bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-gray-700 focus:border-emerald-500 focus:outline-none pb-1"
                />
                <button onClick={() => removeScenario(active.id)} className="text-red-400 hover:text-red-500 text-sm">Delete</button>
              </div>

              <div className="space-y-3">
                {active.changes.map((c, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <select
                      value={c.type}
                      onChange={e => updateChange(active.id, i, { type: e.target.value as ScenarioChange['type'] })}
                      className="px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 focus:outline-none"
                    >
                      <option value="expense_cut">Cut Expense</option>
                      <option value="income_add">Add Income</option>
                      <option value="extra_payment">Extra Payment</option>
                    </select>

                    {c.type === 'expense_cut' && (
                      <select
                        value={c.category || ''}
                        onChange={e => updateChange(active.id, i, { category: e.target.value })}
                        className="px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 focus:outline-none"
                      >
                        {catNames.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        {catNames.length === 0 && <option>Import expenses first</option>}
                      </select>
                    )}

                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <input
                        type="number"
                        value={c.amount || ''}
                        onChange={e => updateChange(active.id, i, { amount: Number(e.target.value) })}
                        className="w-24 pl-6 pr-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="0"
                      />
                    </div>
                    <span className="text-xs text-gray-400">/mo</span>

                    <input
                      value={c.description}
                      onChange={e => updateChange(active.id, i, { description: e.target.value })}
                      className="flex-1 min-w-[120px] px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Description"
                    />

                    <button onClick={() => removeChange(active.id, i)} className="text-red-400 hover:text-red-500">×</button>
                  </div>
                ))}

                <button
                  onClick={() => addChange(active.id)}
                  className="w-full py-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 text-sm text-gray-500 hover:border-emerald-500 hover:text-emerald-500 transition-colors"
                >
                  + Add Change
                </button>
              </div>

              {/* Impact summary */}
              {(() => {
                const result = scenarioResults.find(r => r.scenario.id === active.id);
                if (!result) return null;
                return (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Extra/mo</p>
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{fmt(result.extra)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Payoff Time</p>
                      <p className="text-lg font-bold">{result.result.totalMonths} mo</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Months Saved</p>
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{result.monthsSaved}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Interest Saved</p>
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{fmt(result.interestSaved)}</p>
                    </div>
                  </div>
                );
              })()}
            </Card>
          ) : (
            <Card>
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                Select or create a scenario to get started.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Comparison chart */}
      {comparisonData.length > 1 && (
        <Card title="Scenario Comparison">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={120} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(17,24,39,0.9)', border: 'none', borderRadius: '8px', color: '#e5e7eb' }} />
                <Legend />
                <Bar dataKey="months" name="Months to Payoff" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}
