import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Become a Verified Roaster Partner — tāst Coffee',
  description:
    'tāst is building the definitive platform for specialty coffee discovery. Apply to become a founding roaster partner.',
  openGraph: {
    title: 'Become a Verified Roaster Partner — tāst Coffee',
    description:
      'tāst is building the definitive platform for specialty coffee discovery. Apply to become a founding roaster partner.',
    type: 'website',
    siteName: 'tāst Coffee',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Become a Verified Roaster Partner — tāst Coffee',
    description:
      'tāst is building the definitive platform for specialty coffee discovery. Apply to become a founding roaster partner.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@400;500;700&family=Caveat:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-london-fog text-rich-black font-body min-h-screen antialiased">
        <a href="#apply" className="skip-to-content">
          Skip to application form
        </a>
        {children}
      </body>
    </html>
  );
}
