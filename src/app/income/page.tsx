'use client';

import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { useBudget } from '@/lib/store';
import type { IncomeSource } from '@/lib/types';
import Card from '@/components/Card';
import { fmt } from '@/lib/format';

export default function IncomePage() {
  const { incomes, setIncomes, partnerNames, setPartnerNames } = useBudget();
  const [editing, setEditing] = useState<string | null>(null);

  const add = (owner: 'partner1' | 'partner2', type: 'salary' | 'side') => {
    const inc: IncomeSource = { id: uuid(), label: type === 'salary' ? 'Salary' : 'Side Income', owner, type, amount: 0 };
    setIncomes([...incomes, inc]);
    setEditing(inc.id);
  };

  const update = (id: string, patch: Partial<IncomeSource>) => {
    setIncomes(incomes.map(i => (i.id === id ? { ...i, ...patch } : i)));
  };

  const remove = (id: string) => {
    setIncomes(incomes.filter(i => i.id !== id));
    if (editing === id) setEditing(null);
  };

  const byOwner = (owner: 'partner1' | 'partner2') => incomes.filter(i => i.owner === owner);
  const total = (owner: 'partner1' | 'partner2') => byOwner(owner).reduce((s, i) => s + i.amount, 0);
  const grandTotal = incomes.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Income Tracker</h1>

      {/* Partner names */}
      <Card title="Partner Names">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {([0, 1] as const).map(i => (
            <input
              key={i}
              value={partnerNames[i]}
              onChange={e => {
                const names: [string, string] = [...partnerNames] as [string, string];
                names[i] = e.target.value;
                setPartnerNames(names);
              }}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder={`Partner ${i + 1} name`}
            />
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(['partner1', 'partner2'] as const).map((owner, idx) => (
          <Card key={owner} title={partnerNames[idx]}>
            <div className="space-y-3">
              {byOwner(owner).map(inc => (
                <div key={inc.id} className="flex items-center gap-2">
                  {editing === inc.id ? (
                    <>
                      <input
                        value={inc.label}
                        onChange={e => update(inc.id, { label: e.target.value })}
                        className="flex-1 px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Label"
                      />
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                        <input
                          type="number"
                          value={inc.amount || ''}
                          onChange={e => update(inc.id, { amount: Number(e.target.value) })}
                          className="w-28 pl-6 pr-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="0"
                        />
                      </div>
                      <select
                        value={inc.type}
                        onChange={e => update(inc.id, { type: e.target.value as 'salary' | 'side' })}
                        className="px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none dark:bg-gray-900"
                      >
                        <option value="salary">Salary</option>
                        <option value="side">Side</option>
                      </select>
                      <button onClick={() => setEditing(null)} className="text-emerald-500 text-sm font-medium">Done</button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${inc.type === 'salary' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                        {inc.label}
                      </span>
                      <span className="text-sm font-medium">{fmt(inc.amount)}/mo</span>
                      <button onClick={() => setEditing(inc.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm">Edit</button>
                      <button onClick={() => remove(inc.id)} className="text-red-400 hover:text-red-500 text-sm">×</button>
                    </>
                  )}
                </div>
              ))}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => add(owner, 'salary')}
                  className="text-xs px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-colors"
                >
                  + Salary
                </button>
                <button
                  onClick={() => add(owner, 'side')}
                  className="text-xs px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
                >
                  + Side Income
                </button>
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                <p className="text-sm font-medium">Subtotal: <span className="text-emerald-600 dark:text-emerald-400">{fmt(total(owner))}/mo</span></p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Combined Monthly Income</p>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{fmt(grandTotal)}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{fmt(grandTotal * 12)}/year</p>
        </div>
      </Card>
    </div>
  );
}
