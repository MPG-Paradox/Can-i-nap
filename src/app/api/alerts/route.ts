import { NextRequest, NextResponse } from 'next/server';
import { getRecentAlerts } from '@/lib/alert-store';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hours = parseInt(searchParams.get('hours') || '24', 10);
  const alerts = getRecentAlerts(hours);
  return NextResponse.json(alerts);
}
