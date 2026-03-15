'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { useState } from 'react';

const links = [
  { href: '/', label: 'Dashboard', icon: '⊞' },
  { href: '/income', label: 'Income', icon: '$' },
  { href: '/debts', label: 'Debts', icon: '⊟' },
  { href: '/import', label: 'Import', icon: '↑' },
  { href: '/expenses', label: 'Expenses', icon: '≡' },
  { href: '/scenarios', label: 'What-If', icon: '?' },
  { href: '/suggestions', label: 'Tips', icon: '!' },
  { href: '/projections', label: 'Savings', icon: '∞' },
];

export default function Nav() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <span className="font-bold text-lg text-emerald-600">O&apos;Konnolly Budget</span>
        <button onClick={() => setOpen(!open)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <span className="text-xl">{open ? '✕' : '☰'}</span>
        </button>
      </div>

      {/* Sidebar */}
      <nav className={`
        ${open ? 'block' : 'hidden'} md:block
        fixed md:static inset-0 top-[57px] md:top-0 z-40
        w-full md:w-56 shrink-0
        bg-white dark:bg-gray-900 md:bg-gray-50 md:dark:bg-gray-950
        border-r border-gray-200 dark:border-gray-800
        md:min-h-screen overflow-y-auto
      `}>
        <div className="hidden md:block p-5 pb-2">
          <h1 className="font-bold text-lg text-emerald-600 dark:text-emerald-400">O&apos;Konnolly</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Budget Tool</p>
        </div>

        <div className="flex flex-col gap-1 p-3">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${pathname === l.href
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
            >
              <span className="w-5 text-center font-mono">{l.icon}</span>
              {l.label}
            </Link>
          ))}
        </div>

        <div className="p-3 mt-auto border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={toggle}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="w-5 text-center">{theme === 'dark' ? '☀' : '☾'}</span>
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </nav>
    </>
  );
}
