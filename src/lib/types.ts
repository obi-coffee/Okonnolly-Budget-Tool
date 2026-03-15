export interface IncomeSource {
  id: string;
  label: string;
  owner: 'partner1' | 'partner2';
  type: 'salary' | 'side';
  amount: number; // monthly
}

export interface Debt {
  id: string;
  name: string;
  balance: number;
  interestRate: number; // annual %
  minimumPayment: number;
}

export interface Transaction {
  date: string;
  description: string;
  amount: number;
  category: string;
}

export interface CategorySummary {
  category: string;
  monthly: number[];
  annualEstimate: number;
}

export interface Scenario {
  id: string;
  name: string;
  changes: ScenarioChange[];
}

export interface ScenarioChange {
  type: 'expense_cut' | 'income_add' | 'extra_payment';
  category?: string;
  amount: number; // positive = savings/income, used as delta
  description: string;
}

export interface Suggestion {
  id: string;
  text: string;
  monthlySavings: number;
  monthsFaster: number;
  category?: string;
}

export interface BudgetState {
  incomes: IncomeSource[];
  debts: Debt[];
  transactions: Transaction[];
  categories: CategorySummary[];
  scenarios: Scenario[];
  partnerNames: [string, string];
}

export const DEFAULT_CATEGORIES = [
  'Groceries',
  'Dining Out',
  'Subscriptions',
  'Utilities',
  'Rent/Mortgage',
  'Transportation',
  'Gas',
  'Insurance',
  'Healthcare',
  'Entertainment',
  'Shopping',
  'Personal Care',
  'Pets',
  'Gifts',
  'Travel',
  'Education',
  'Childcare',
  'Home Improvement',
  'Clothing',
  'Other',
] as const;

export const SEASONAL_WEIGHTS: Record<string, number[]> = {
  // Jan-Dec multipliers (1.0 = average)
  'Groceries':        [1.0, 1.0, 1.0, 1.0, 1.0, 1.05, 1.1, 1.05, 1.0, 1.0, 1.1, 1.2],
  'Dining Out':       [0.9, 0.9, 1.0, 1.0, 1.1, 1.2, 1.2, 1.2, 1.0, 1.0, 1.0, 1.1],
  'Utilities':        [1.3, 1.2, 1.0, 0.9, 0.8, 1.0, 1.3, 1.3, 1.0, 0.8, 0.9, 1.2],
  'Travel':           [0.5, 0.6, 1.0, 1.0, 1.2, 1.5, 1.8, 1.5, 1.0, 0.8, 0.5, 1.2],
  'Gifts':            [0.5, 0.8, 0.5, 0.5, 0.8, 0.5, 0.5, 0.5, 0.5, 0.5, 1.0, 3.0],
  'Entertainment':    [0.9, 0.9, 1.0, 1.0, 1.1, 1.2, 1.3, 1.2, 1.0, 1.0, 0.9, 1.1],
  'Shopping':         [0.8, 0.7, 0.9, 0.9, 1.0, 1.0, 1.0, 1.1, 1.0, 1.0, 1.5, 1.8],
  'Clothing':         [0.8, 0.7, 1.1, 1.2, 1.0, 0.9, 0.8, 1.2, 1.1, 1.0, 1.2, 1.0],
};
