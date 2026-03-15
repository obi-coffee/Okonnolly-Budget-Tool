'use client';

import type { ReactNode } from 'react';

export default function Card({
  children,
  title,
  className = '',
}: {
  children: ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 ${className}`}>
      {title && <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{title}</h2>}
      {children}
    </div>
  );
}

export function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">{value}</p>
      {sub && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}
