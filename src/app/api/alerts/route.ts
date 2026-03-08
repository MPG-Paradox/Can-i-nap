import { NextRequest, NextResponse } from 'next/server';
import { getRecentAlerts } from '@/lib/alert-store';

export const dynamic = 'force-dynamic';

// PRODUCTION TODO: Add rate limiting for public deployment
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawHours = parseInt(searchParams.get('hours') || '24', 10);

  // Validate: must be a positive number, max 168 (7 days)
  if (isNaN(rawHours) || rawHours <= 0) {
    return NextResponse.json({ error: 'hours must be a positive number' }, { status: 400 });
  }
  const hours = Math.min(rawHours, 168);

  const alerts = getRecentAlerts(hours);
  return NextResponse.json(alerts);
}
