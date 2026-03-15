'use client';

import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { useBudget } from '@/lib/store';
import { categorizeTransaction, isCreditCardPayment } from '@/lib/categorize';
import { rememberCategories } from '@/lib/categoryMemory';
import { parsePdf } from '@/lib/parsePdf';
import type { Transaction, AccountType, CategorySummary } from '@/lib/types';
import { DEFAULT_CATEGORIES } from '@/lib/types';
import Card from '@/components/Card';
import { fmt } from '@/lib/format';

export default function ImportPage() {
  const { transactions, setTransactions, categories, setCategories } = useBudget();
  const [preview, setPreview] = useState<Transaction[]>([]);
  const [importing, setImporting] = useState(false);
  const [editCats, setEditCats] = useState<Record<number, string>>({});
  const [parseError, setParseError] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<AccountType>('credit_card');
  const [excludeFlags, setExcludeFlags] = useState<Record<number, boolean>>({});

  // ---------- Merge into preview (supports adding multiple files) ----------
  const applyPreview = useCallback((txns: Transaction[]) => {
    setPreview(prev => {
      const combined = [...prev, ...txns];
      setExcludeFlags(flags => {
        const newFlags = { ...flags };
        combined.forEach((t, i) => {
          if (t.isCcPayment && !(i in newFlags)) newFlags[i] = true;
        });
        return newFlags;
      });
      return combined;
    });
  }, []);

  // ---------- CSV parsing ----------
  const handleCsv = useCallback((file: File, source: AccountType) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const rows = result.data as Record<string, string>[];
        const txns: Transaction[] = [];

        for (const row of rows) {
          const date = row['Date'] || row['date'] || row['Transaction Date'] || row['Posted Date'] || row['Posting Date'] || Object.values(row)[0] || '';
          const desc = row['Description'] || row['description'] || row['Memo'] || row['memo'] || row['Name'] || row['Payee'] || Object.values(row)[1] || '';

          let amountStr = row['Amount'] || row['amount'] || row['Debit'] || row['debit'] || '';
          if (!amountStr) {
            const debit = row['Debit'] || row['Withdrawal'] || '';
            const credit = row['Credit'] || row['Deposit'] || '';
            amountStr = debit || credit || Object.values(row)[2] || '';
          }

          const amount = Math.abs(parseFloat(amountStr.replace(/[$,]/g, '')) || 0);
          if (amount === 0) continue;

          const description = desc.trim();
          const ccFlag = source === 'checking' && isCreditCardPayment(description);
          const category = ccFlag ? 'Credit Card Payment' : categorizeTransaction(description);
          txns.push({ date, description, amount, category, source, isCcPayment: ccFlag });
        }

        applyPreview(txns);
        setImporting(false);
      },
      error: () => setImporting(false),
    });
  }, [applyPreview]);

  // ---------- File handler ----------
  const handleFile = useCallback((file: File) => {
    setImporting(true);
    setParseError(null);

    const source = accountType;

    if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
      parsePdf(file)
        .then((txns) => {
          if (txns.length === 0) {
            setParseError('No transactions found in this PDF. The parser looks for lines with a date and dollar amount. Try exporting a CSV from your bank instead.');
          }
          const stamped = txns.map(t => {
            const ccFlag = source === 'checking' && isCreditCardPayment(t.description);
            return {
              ...t,
              source,
              isCcPayment: ccFlag,
              category: ccFlag ? 'Credit Card Payment' : t.category,
            };
          });
          applyPreview(stamped);
        })
        .catch(() => {
          setParseError('Could not read this PDF. The file may be image-based (scanned). Try a CSV export from your bank instead.');
        })
        .finally(() => setImporting(false));
    } else {
      handleCsv(file, source);
    }
  }, [accountType, handleCsv, applyPreview]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
      handleFile(files[i]);
    }
  }, [handleFile]);

  // ---------- Confirm import ----------
  const confirmImport = () => {
    // Apply category edits and filter out excluded CC payments
    const edited: Transaction[] = [];
    for (let i = 0; i < preview.length; i++) {
      if (excludeFlags[i]) continue; // skip excluded CC payments
      const t = preview[i];
      const cat = editCats[i] || t.category;
      edited.push({ ...t, category: cat });
    }

    // Save learned categories for future imports
    rememberCategories(edited.map(t => ({ description: t.description, category: t.category })));

    const all = [...transactions, ...edited];
    setTransactions(all);
    rebuildCategories(all);
    setPreview([]);
    setEditCats({});
    setExcludeFlags({});
  };

  const rebuildCategories = (txns: Transaction[]) => {
    const map: Record<string, number[]> = {};
    for (const t of txns) {
      if (t.isCcPayment) continue; // never count CC payments in spending categories
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

  const flaggedCount = preview.filter((_, i) => excludeFlags[i]).length;
  const importCount = preview.length - flaggedCount;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Import Bank Statements</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Upload CSV or PDF statements from your bank and credit cards. Select the account type, then upload. You can add multiple files before confirming.
      </p>

      {/* Account type selector + upload zone */}
      <Card>
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-3">Account type:</label>
          <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setAccountType('credit_card')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${accountType === 'credit_card' ? 'bg-emerald-600 text-white' : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              Credit Card
            </button>
            <button
              onClick={() => setAccountType('checking')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${accountType === 'checking' ? 'bg-emerald-600 text-white' : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              Checking Account
            </button>
          </div>
          {accountType === 'checking' && (
            <p className="text-xs text-gray-400 mt-1">
              Credit card payments will be auto-detected and excluded to avoid double-counting.
            </p>
          )}
        </div>

        <div
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-10 text-center hover:border-emerald-500 transition-colors"
        >
          <p className="text-gray-500 dark:text-gray-400 mb-3">
            {importing ? 'Processing...' : 'Drag & drop CSV or PDF files here, or click to browse'}
          </p>
          {parseError && (
            <p className="text-sm text-red-500 mb-3">{parseError}</p>
          )}
          <input
            type="file"
            accept=".csv,.pdf"
            multiple
            onChange={e => {
              const files = e.target.files;
              if (files) for (let i = 0; i < files.length; i++) handleFile(files[i]);
            }}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-block px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium cursor-pointer hover:bg-emerald-700 transition-colors"
          >
            Choose Files
          </label>
        </div>
      </Card>

      {/* Preview */}
      {preview.length > 0 && (
        <Card title={`Preview — ${preview.length} transactions found`}>
          {flaggedCount > 0 && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm">
              <span className="font-medium text-amber-700 dark:text-amber-400">{flaggedCount} credit card payment{flaggedCount > 1 ? 's' : ''} detected</span>
              <span className="text-amber-600 dark:text-amber-500"> — excluded to avoid double-counting with your credit card statement. Uncheck to include.</span>
            </div>
          )}

          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white dark:bg-gray-900">
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                  <th className="py-2 pr-1 w-8"></th>
                  <th className="py-2 pr-2">Date</th>
                  <th className="py-2 pr-2">Description</th>
                  <th className="py-2 pr-2">Source</th>
                  <th className="py-2 pr-2 text-right">Amount</th>
                  <th className="py-2">Category</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((t, i) => {
                  const excluded = !!excludeFlags[i];
                  return (
                    <tr key={i} className={`border-t border-gray-100 dark:border-gray-800 ${excluded ? 'opacity-40' : ''}`}>
                      <td className="py-1.5 pr-1">
                        <input
                          type="checkbox"
                          checked={!excluded}
                          onChange={() => setExcludeFlags(f => ({ ...f, [i]: !f[i] }))}
                          className="rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="py-1.5 pr-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">{t.date}</td>
                      <td className="py-1.5 pr-2 truncate max-w-[180px]" title={t.description}>
                        {t.description}
                        {t.isCcPayment && (
                          <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 font-medium">CC PAYMENT</span>
                        )}
                      </td>
                      <td className="py-1.5 pr-2 text-xs text-gray-400">
                        {t.source === 'checking' ? 'Checking' : 'Credit Card'}
                      </td>
                      <td className="py-1.5 pr-2 text-right font-medium">{fmt(t.amount)}</td>
                      <td className="py-1.5">
                        {t.isCcPayment ? (
                          <span className="text-xs text-gray-400">Credit Card Payment</span>
                        ) : (
                          <select
                            value={editCats[i] || t.category}
                            onChange={e => setEditCats({ ...editCats, [i]: e.target.value })}
                            className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          >
                            {DEFAULT_CATEGORIES.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button onClick={() => { setPreview([]); setEditCats({}); setExcludeFlags({}); }} className="px-4 py-2 text-sm rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button onClick={confirmImport} className="px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors">
              Import {importCount} Transaction{importCount !== 1 ? 's' : ''}
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
