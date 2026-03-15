'use client';

import { createContext, useContext } from 'react';
import type { BudgetState, IncomeSource, Debt, Transaction, CategorySummary, Scenario } from './types';

export interface BudgetActions {
  setIncomes: (incomes: IncomeSource[]) => void;
  setDebts: (debts: Debt[]) => void;
  setTransactions: (txns: Transaction[]) => void;
  setCategories: (cats: CategorySummary[]) => void;
  setScenarios: (scenarios: Scenario[]) => void;
  setPartnerNames: (names: [string, string]) => void;
}

export const BudgetContext = createContext<(BudgetState & BudgetActions) | null>(null);

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error('useBudget must be used within BudgetProvider');
  return ctx;
}

const STORAGE_KEY = 'okonnolly-budget';

export function loadState(): BudgetState {
  if (typeof window === 'undefined') return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return defaultState();
}

export function saveState(state: BudgetState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

function defaultState(): BudgetState {
  return {
    incomes: [],
    debts: [],
    transactions: [],
    categories: [],
    scenarios: [],
    partnerNames: ['Partner 1', 'Partner 2'],
  };
}
