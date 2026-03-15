'use client';

import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { useBudget } from '@/lib/store';
import { categorizeTransaction } from '@/lib/categorize';
import type { Transaction, CategorySummary } from '@/lib/types';
import Card from '@/components/Card';
import { fmt } from '@/lib/format';

export default function ImportPage() {
  const { transactions, setTransactions, categories, setCategories } = useBudget();
  const [preview, setPreview] = useState<Transaction[]>([]);
  const [importing, setImporting] = useState(false);
  const [editCats, setEditCats] = useState<Record<number, string>>({});

  const handleFile = useCallback((file: File) => {
    setImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const rows = result.data as Record<string, string>[];
        const txns: Transaction[] = [];

        for (const row of rows) {
          // Try to find date, description, and amount columns
          const date = row['Date'] || row['date'] || row['Transaction Date'] || row['Posted Date'] || row['Posting Date'] || Object.values(row)[0] || '';
          const desc = row['Description'] || row['description'] || row['Memo'] || row['memo'] || row['Name'] || row['Payee'] || Object.values(row)[1] || '';

          // Try multiple amount column names
          let amountStr = row['Amount'] || row['amount'] || row['Debit'] || row['debit'] || '';
          if (!amountStr) {
            // Try credit/debit columns
            const debit = row['Debit'] || row['Withdrawal'] || '';
            const credit = row['Credit'] || row['Deposit'] || '';
            amountStr = debit || credit || Object.values(row)[2] || '';
          }

          const amount = Math.abs(parseFloat(amountStr.replace(/[$,]/g, '')) || 0);
          if (amount === 0) continue;

          const category = categorizeTransaction(desc);
          txns.push({ date, description: desc.trim(), amount, category });
        }

        setPreview(txns);
        setImporting(false);
      },
      error: () => setImporting(false),
    });
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const confirmImport = () => {
    // Apply any category edits
    const edited = preview.map((t, i) => editCats[i] ? { ...t, category: editCats[i] } : t);
    const all = [...transactions, ...edited];
    setTransactions(all);
    rebuildCategories(all);
    setPreview([]);
    setEditCats({});
  };

  const rebuildCategories = (txns: Transaction[]) => {
    const map: Record<string, number[]> = {};
    for (const t of txns) {
      if (!map[t.category]) map[t.category] = Array(12).fill(0);
      const month = new Date(t.date).getMonth();
      if (!isNaN(month)) map[t.category][month] += t.amount;
    }
    const cats: CategorySummary[] = Object.entries(map).map(([category, monthly]) => ({
      category,
      monthly,
      annualEstimate: monthly.reduce((a, b) => a + b, 0),
    }));
    cats.sort((a, b) => b.annualEstimate - a.annualEstimate);
    setCategories(cats);
  };

  const clearAll = () => {
    setTransactions([]);
    setCategories([]);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Import Bank Statements</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Upload CSV files from your bank. Transactions are auto-categorized — you can adjust categories before confirming.
      </p>

      {/* Upload zone */}
      <Card>
        <div
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-10 text-center hover:border-emerald-500 transition-colors"
        >
          <p className="text-gray-500 dark:text-gray-400 mb-3">
            {importing ? 'Processing...' : 'Drag & drop a CSV file here, or click to browse'}
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="inline-block px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium cursor-pointer hover:bg-emerald-700 transition-colors"
          >
            Choose CSV File
          </label>
        </div>
      </Card>

      {/* Preview */}
      {preview.length > 0 && (
        <Card title={`Preview — ${preview.length} transactions found`}>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white dark:bg-gray-900">
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                  <th className="py-2 pr-2">Date</th>
                  <th className="py-2 pr-2">Description</th>
                  <th className="py-2 pr-2 text-right">Amount</th>
                  <th className="py-2">Category</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((t, i) => (
                  <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="py-1.5 pr-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">{t.date}</td>
                    <td className="py-1.5 pr-2 truncate max-w-[200px]">{t.description}</td>
                    <td className="py-1.5 pr-2 text-right font-medium">{fmt(t.amount)}</td>
                    <td className="py-1.5">
                      <select
                        value={editCats[i] || t.category}
                        onChange={e => setEditCats({ ...editCats, [i]: e.target.value })}
                        className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        {['Groceries', 'Dining Out', 'Subscriptions', 'Utilities', 'Rent/Mortgage', 'Transportation', 'Gas', 'Insurance', 'Healthcare', 'Entertainment', 'Shopping', 'Personal Care', 'Pets', 'Gifts', 'Travel', 'Education', 'Childcare', 'Home Improvement', 'Clothing', 'Other'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button onClick={() => { setPreview([]); setEditCats({}); }} className="px-4 py-2 text-sm rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button onClick={confirmImport} className="px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors">
              Import {preview.length} Transactions
            </button>
          </div>
        </Card>
      )}

      {/* Existing data summary */}
      {transactions.length > 0 && (
        <Card title={`Imported Data — ${transactions.length} transactions`}>
          <div className="space-y-2">
            {categories.map(cat => (
              <div key={cat.category} className="flex items-center gap-3">
                <span className="flex-1 text-sm">{cat.category}</span>
                <span className="text-sm font-medium">{fmt(cat.annualEstimate)}</span>
                <span className="text-xs text-gray-400">annual</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
            <span className="text-sm font-medium">
              Total: {fmt(categories.reduce((s, c) => s + c.annualEstimate, 0))}/year
            </span>
            <button onClick={clearAll} className="text-xs text-red-400 hover:text-red-500">
              Clear All Data
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
