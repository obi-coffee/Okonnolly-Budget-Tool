import { NextResponse } from 'next/server';
import { sendNotificationEmail } from '@/lib/resend';
import { appendToSheet } from '@/lib/sheets';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Basic server-side validation
    if (!data.roasteryName?.trim() || !data.contactName?.trim() || !data.email?.trim() || !data.location?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Run email and sheets in parallel, but don't fail the request if one fails
    const results = await Promise.allSettled([
      sendNotificationEmail(data),
      appendToSheet(data),
    ]);

    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r) => r.reason?.message || 'Unknown error');

    if (errors.length > 0) {
      console.error('Partial submission errors:', errors);
      // If both failed, return error
      if (errors.length === results.length) {
        return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
