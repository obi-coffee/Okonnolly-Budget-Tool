# tāst Coffee — Verified Roaster Partner Landing Page

A Next.js landing page for tāst Coffee's Verified Roaster Partner (VRP) program. Collects interest from prospective roaster partners.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the values:

```bash
cp .env.local.example .env.local
```

### Resend (Email Notifications)

1. Sign up at [resend.com](https://resend.com)
2. Create an API key in the dashboard
3. Set `RESEND_API_KEY` in `.env.local`
4. Set `NOTIFICATION_EMAIL` to the email address that should receive application notifications
5. For production, verify your sending domain in Resend and update the `from` address in `src/lib/resend.ts`

### Google Sheets (Submission Logging)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Enable the **Google Sheets API** under APIs & Services
4. Go to **Credentials** > Create Credentials > **Service Account**
5. Give it a name (e.g., "tast-vrp-sheets") and create
6. Click the service account > **Keys** tab > Add Key > Create new key > **JSON**
7. From the downloaded JSON, copy:
   - `client_email` → `GOOGLE_SHEETS_CLIENT_EMAIL`
   - `private_key` → `GOOGLE_SHEETS_PRIVATE_KEY` (keep the quotes and `\n` characters)
8. Create a Google Sheet and add these headers to Row 1:
   `Timestamp | Roastery Name | Contact Name | Email | Phone | Location | Website | Instagram | Year Founded | Heard About | Interest | Notes`
9. Share the sheet with the service account email (Editor access)
10. Copy the spreadsheet ID from the URL (`/spreadsheets/d/{THIS_PART}/edit`) → `GOOGLE_SHEETS_SPREADSHEET_ID`

## Deploy to Vercel

1. Push the repo to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Add all environment variables from `.env.local.example` in the Vercel project settings
4. Deploy

## Swapping the Logo for an SVG

The logo is rendered as styled text in `src/components/Logo.tsx`. To use an SVG:

1. Place your SVG file in `public/` (e.g., `public/tast-logo.svg`)
2. Update `src/components/Logo.tsx`:

```tsx
import Image from 'next/image';

export default function Logo() {
  return (
    <a href="/" aria-label="tāst Coffee home">
      <Image src="/tast-logo.svg" alt="tāst Coffee" width={120} height={40} />
    </a>
  );
}
```

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Email**: Resend
- **Data**: Google Sheets API
- **Deployment**: Vercel
