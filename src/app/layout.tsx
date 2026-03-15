import type { Metadata } from 'next';
import './globals.css';
import ThemeProvider from '@/components/ThemeProvider';
import BudgetProvider from '@/components/BudgetProvider';
import Nav from '@/components/Nav';

export const metadata: Metadata = {
  title: "O'Konnolly Budget Tool",
  description: 'Proactive budgeting for couples — pay down debt, build wealth together.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen font-sans">
        <ThemeProvider>
          <BudgetProvider>
            <div className="flex flex-col md:flex-row min-h-screen">
              <Nav />
              <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
                {children}
              </main>
            </div>
          </BudgetProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
