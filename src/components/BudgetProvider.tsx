'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { BudgetContext, loadState, saveState } from '@/lib/store';
import type { IncomeSource, Debt, Transaction, CategorySummary, Scenario } from '@/lib/types';

export default function BudgetProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [incomes, setIncomes] = useState<IncomeSource[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [partnerNames, setPartnerNames] = useState<[string, string]>(['Partner 1', 'Partner 2']);

  useEffect(() => {
    const state = loadState();
    setIncomes(state.incomes);
    setDebts(state.debts);
    setTransactions(state.transactions);
    setCategories(state.categories);
    setScenarios(state.scenarios);
    setPartnerNames(state.partnerNames);
    setLoaded(true);
  }, []);

  const persist = useCallback(() => {
    saveState({ incomes, debts, transactions, categories, scenarios, partnerNames });
  }, [incomes, debts, transactions, categories, scenarios, partnerNames]);

  useEffect(() => {
    if (loaded) persist();
  }, [loaded, persist]);

  if (!loaded) return null;

  return (
    <BudgetContext.Provider
      value={{
        incomes, setIncomes,
        debts, setDebts,
        transactions, setTransactions,
        categories, setCategories,
        scenarios, setScenarios,
        partnerNames, setPartnerNames,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
}
