import { NextRequest, NextResponse } from 'next/server';
import { getEvents } from '@/lib/events';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const afterId = searchParams.get('after') || undefined;

  const events = getEvents(afterId);

  return NextResponse.json({ events });
}
